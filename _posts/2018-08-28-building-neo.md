---
title: Building Neo
date: '2018-08-28T14:05:31+08:00'
tags:
  - default
---
It's painful to have my network bandwidth throttled by my university. That's the main reason why I built Neo. Neo is a group of proxy and relay servers specially configured to provide high-speed, low-latency, and reliable *Internet* access for users on my university campus. This post is where I note down the main process to build Neo.

This post is messy, and needs refining in the future.

<br>

## My Goals
- Bypass the bandwidth throttling and make network speed as high as possible. (It should be noted that we have speed limit on each Intranet IP address, but we can have unlimited Intranet IP addresses.)
- Obtain *Inter*net Access.
- Low latency and high stability.

<br>

## Bypassing the bandwidth throttling

Based on the fact that I mentioned in the previous section, I'm choosing MPTCP to do this. MPTCP stands for "multi-path TCP" and requires both the client and the server to have it installed so they speak MPTCP.

A guide to the installation of MPTCP could be found here: https://multipath-tcp.org/pmwiki.php/Users/HowToInstallMPTCP?

For Raspberry Pis, I would use my own script described [here](https://cnly.github.io/2018/06/11/building-and-installing-latest-mptcp-for-raspberry-pi.html).

We're setting up the server on campus first. After installation, we need a bunch of Intranet IP addresses. This can be easily done with several `ip link add type macvlan`. I'm using Ubuntu/Debian on the servers so I've automated this in `/etc/network/interfaces` like:

```
auto neo1
iface neo1 inet dhcp
pre-up ip link add link ens3 neo1 address <redacted> type macvlan
post-down ip link del neo1

auto neo2
iface neo2 inet dhcp
pre-up ip link add link ens3 neo2 address <redacted> type macvlan
post-down ip link del neo2
```
where `ens3` is the physical interface of the server.

According to the MPTCP website, routing table needs to be configured for multiple addresses to work properly. Because I'm using `ifupdown` to manage interfaces, I'm automating this with two files:

**`/etc/network/if-up.d/mptcp-up`**:
```
#!/bin/sh

set -e

env > /etc/network/if_up_env

if [ "$IFACE" = lo -o "$MODE" != start ]; then
    exit 0
fi

IP=$(ip route list dev $IFACE | awk '{split($0,a,"\\s+"); print a[7]}')
SUBNET=$(ip route list dev $IFACE | awk '{split($0,a,"\\s+"); print a[1]}')
GATEWAY=$(ip route | grep default | awk '{split($0,a,"\\s+"); print a[3]}')
TABLE=$(echo $IFACE | grep -oP '[0-9]+')
if [ "$IFACE" = ens3 ]; then
    TABLE=33
fi

ip rule add from $IP table $TABLE
ip route add table $TABLE to $SUBNET dev $IFACE scope link
ip route add table $TABLE default via $GATEWAY dev $IFACE
```
where `ens3` is the physical interface of the server.

**`/etc/network/if-post-down.d/mptcp-down`**:
```
#!/bin/sh

set -e

env > /etc/network/if_down_env

if [ "$IFACE" = lo -o "$MODE" != stop ]; then
        exit 0
fi

TABLE=$(echo $IFACE | grep -oP '[0-9]+')

ip rule del table $TABLE
ip route flush table $TABLE
```

Now it seems we are almost done on the local server. Each of my proxy and relay servers on the Internet have one IP address, so no need to configure routing table on them.

Once local and remote servers are set up, connect them with a proxy program, for example V2Ray, and this is done.

<br>

## Lower the latency and improving the stability (1)

In order for Neo to survive those random Internet routing failures and some others, it's necessary that we make full use of MPTCP and establish multiple connections to our proxy server via different routes. I call the servers on different routes helping to forward traffic to and from the proxy server "relay servers."

We're using relay servers to forward unmodified TCP packets so iptables should be enough. A few `DNAT` and `SNAT` rules should do this. `net.ipv4.ip_forward=1` is also required.

On our proxy server, things becoming a little more difficult. In order for MPTCP to tell the client to connect through several different IP addresses, we need to add some dummy interfaces with those addresses so MPTCP can obtain them when it looks through all the interfaces. But if we just simply add dummy interfaces, another problem arises that kernel will not be willing to really send packets headed for local addresses out on wire. Also, kernel by default rejects incoming packets with local addresses (this can be disabled, though).

Fortunately, we still get a way to solve this, which is to use `netns` (net namespace). We need to run the proxy program inside an isolated network namespace with those relay server addresses attached to a dummy interface. Then, in the main namespace, we need to use iptables to `SNAT` the incoming packets from the relay servers to some other unrelated addresses so they don't get rejected after being `DNAT`ed to that newly created namespace.

<br>

## Lower the latency and improving the stability (2)

We can also select the proxy/relay server with which a connection should be initiated in real time. I'm doing this with a simple Go program that tries to connect to multiple addresses at the same time but only preserving the first connection established.
