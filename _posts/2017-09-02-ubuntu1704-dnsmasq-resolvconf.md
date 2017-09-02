---
title: Ubuntu 17.04 - Conflicts between systemd-resolved, dnsmasq and resolvconf
tags: [ubuntu]
---

I have switched to Ubuntu 17.04 for a while. And when I was trying to create a WiFi hotspot with `create_ap`, I encountered some problems:

## Problem 1: 100% CPU usage with systemd-resolved and 33% with dnsmasq

I spotted this problem when I heared my fans spinning crazily. When I do `top`, I found the phenomena above.

After some search, I found this post useful:

[https://askubuntu.com/questions/909591/systemd-resolve-high-cpu-usage-after-update-to-17-04](https://askubuntu.com/questions/909591/systemd-resolve-high-cpu-usage-after-update-to-17-04)

However, although I found the solution mentioned in the answer works, I don't like changing these system default settings very much. Therefore, I chose to turn off DNS function by dnsmasq, as I don't need that when creating an AP.

### Steps of solution

1. Change `port=53` to `port=0` in `/etc/dnsmasq.conf`
1. Restart dnsmasq

## Problem 2: `/etc/resolv.conf` always has `nameserver 127.0.0.1` in it, instead of `nameserver 127.0.0.53`

This problem would only affect those programs that read `/etc/resolv.conf` for name resolving, for example `dig`. Other programs (such as Chrome) tends to use other interfaces for that(I guess), and thus they were not affected.

This problem is because dnsmasq, even though with DNS `port=0`, tells resolvconf to use `nameserver 127.0.0.1` in its startup script `/etc/init.d/dnsmasq`. See the following snippet from that file for reference:

{% highlight Bash shell scripts %}
start_resolvconf()
{
# If interface "lo" is explicitly disabled in /etc/default/dnsmasq
# Then dnsmasq won't be providing local DNS, so don't add it to
# the resolvconf server set.
        for interface in $DNSMASQ_EXCEPT
        do
                [ $interface = lo ] && return
        done

        if [ -x /sbin/resolvconf ] ; then
                echo "nameserver 127.0.0.1" | /sbin/resolvconf -a lo.$NAME
        fi
        return 0
}

{% endhighlight %}

See also: [https://superuser.com/questions/894513/resolv-conf-keeps-getting-overwritten-when-dnsmasq-is-restarted-breaking-dnsmas](https://superuser.com/questions/894513/resolv-conf-keeps-getting-overwritten-when-dnsmasq-is-restarted-breaking-dnsmas)

### Steps of solution

1. Add the line `DNSMASQ_EXCEPT=lo` to `/etc/defaults/dnsmasq`
1. Restart dnsmasq
