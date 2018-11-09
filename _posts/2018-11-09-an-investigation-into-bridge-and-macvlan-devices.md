---
title: An Investigation Into Bridge and Macvlan Devices
date: '2018-11-09T23:44:21+08:00'
tags:
  - linux
---
Recently when I was playing with bridges on some machines already having macvlan devices, I found some interesting behaviours:
1. I can't enslave a device on which macvlan interfaces have been created to a bridge.
1. If I enslave a macvlan (virtual) interface to a bridge, the bridge does not work well because it just doesn't see traffic headed for other machines (so it can't do the forwarding job)
1. After enslaving a physical device, it seems the traffic of that device is "broken" (E.g., `ping` with the parameter `-I that_device` only yields timeouts, an analysis with `tcpdump` showing ARP reply packets are arriving but the device just "doesn't see" them)

Actually, for the last point, I think that's why people instruct others to move IP addresses, etc. from the slave to the bridge when configuring.

I did a lot of searching and I don't think I've seen an explanation for all my observations convincing enough, so I decided to dig into the source of kernel a bit. I'm by no means an expert or something close to that in terms of kernel; I'm just trying to find an explanation for myself with what I can guess from the code. I'm writing down what I found here so I'll not forget them. If any reader found something wrong in this post, please feel free to point it out.

The code I looked into is of version `v4.19.1` which I found here: https://elixir.bootlin.com/linux/v4.19.1/source

## 1. Why `macvlan` and `br` don't co-exist: Meet `rx_handler`

In the list at the beginning, my first observation was that I can't enslave a device with macvlan interfaces. In fact, with some more testing, I found that if a device is already a slave, I can't create macvlan interfaces on it, either (creating them on the bridge is okay, though).

To explain this, we need to see how `macvlan` and `br` manipulate a device in order to implement their own features. In short, they both rely on a mechanism called `rx_handler` in kernel which allows a third party (`macvlan` or `br` in this case) to handle incoming packets on a device before they are normally processed by that device. A general description of `rx_handler` can be found in the [comments](https://elixir.bootlin.com/linux/v4.19.1/source/include/linux/netdevice.h#L375) for `enum rx_handler_result`.

It should be noted that according to that description, currently, a device can only have at most one `rx_handler`. This is why `macvlan` and `br` conflict. The actions of registration of `rx_handler` by `macvlan` and `br` can be found at [drivers/net/macvlan.c#L1174](https://elixir.bootlin.com/linux/v4.19.1/source/drivers/net/macvlan.c#L1174) and [source/net/bridge/br_if.c#L622](https://elixir.bootlin.com/linux/v4.19.1/source/net/bridge/br_if.c#L622), respectively.

## 2. `macvlan` respects others' privacy and don't want others' packets

To explain my second observation, we need to look into the `rx_handler` used by `macvlan`. It can be found at [drivers/net/macvlan.c#L439](https://elixir.bootlin.com/linux/v4.19.1/source/drivers/net/macvlan.c#L439), and I'm only putting the most important part here:

{% highlight c %}
	if (macvlan_passthru(port))
		vlan = list_first_or_null_rcu(&port->vlans,
					      struct macvlan_dev, list);
	else
		vlan = macvlan_hash_lookup(port, eth->h_dest);
	if (!vlan || vlan->mode == MACVLAN_MODE_SOURCE)
		return RX_HANDLER_PASS;
{% endhighlight %}

I believe this little piece of code is the explanation for my second observation. Note that this only has influence unicast packets, but that's enough for preventing a bridge created on a macvlan from working properly.

To provide some context, `port` in the code can be understood as a wrapper of the underlying physical device such as `eth0`, and `vlan` refers to a `macvlan` virtual interface. So the responsibility of this code is to find out which `macvlan` interface to send the incoming unicast packet to. If a `macvlan` in the `passthru` mode has been created, the packet will just go there. But if not, `macvlan_hash_lookup` will try to find a `macvlan` interface with the destination ethernet address of the packet, and if there isn't one, the `rx_handler` function will return (`return RX_HANDLER_PASS;`) and will not go to any of the `macvlan` interfaces. Since a non-local MAC address is never known by `macvlan`, the bridge created on top of a `macvlan` interface won't be able to see and forward traffic that needs forwarding.

## 3. `br` swallows traffic

Finally, let's look at `br`'s `rx_handler`. The function is found at [net/bridge/br_input.c#L211](https://elixir.bootlin.com/linux/v4.19.1/source/net/bridge/br_input.c#L211). We'll see that (most) packets will come to the line

{% highlight c %}
		NF_HOOK(NFPROTO_BRIDGE, NF_BR_PRE_ROUTING,
			dev_net(skb->dev), NULL, skb, skb->dev, NULL,
			br_handle_frame_finish);
{% endhighlight %}

and eventually

{% highlight c %}
	return RX_HANDLER_CONSUMED;
{% endhighlight %}

With `RX_HANDLER_CONSUMED`, the packets will not be further processed by the `netif_receive_skb` function which has called the `rx_handler`, so the packets will not "appear" on the original device. In fact, incoming packets headed for a local destination will have their `skb->dev` changed from the physical device to the `br` device in the function [`br_pass_frame_up`](https://elixir.bootlin.com/linux/v4.19.1/source/net/bridge/br_input.c#L37) which is called by `br_handle_frame_finish` we've just seen above.

(Note: A description for `skb->dev` (actually, more generally, `skb`) can be found here: [How SKBs work](http://vger.kernel.org/~davem/skb.html).)

Now having the results of this investigation, I'd choose to create `br` to be master of physical devices, move things like DHCP to the bridge, and, when needed, create `macvlan` on the bridge.
