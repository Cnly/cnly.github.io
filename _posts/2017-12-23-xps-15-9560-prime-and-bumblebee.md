---
title: Installing nVidia Prime and Bumblebee on XPS 15 9560 and Getting Things to Work
tags: [ubuntu, xps-15-9560]
---

This post mainly records my steps to install nVidia 387 driver, nVidia Prime and Bumblebee on my XPS 15 9560. I also had to make some minor changes to have things work properly. These changes took me some time to reach, though.

<br/>

## Installing the Driver

The first step is to install the nVidia driver. This can be done easily in the Additional Drivers app provided by Ubuntu. I was experiencing very slow download speed through that GUI, so I did it through command line with proxy enabled. Just install:

<pre>nvidia-387</pre>

with `apt` and then check the package is installed and enabled in Additional Drivers.

At this point, for anyone happy with always using their discrete GPU, they are good to go. But I am on a laptop, so I must take care of the battery consumption.

<br/>

## Installing Prime

Install nVidia Prime by:

{% highlight shell script %}
sudo apt install nvidia-prime
{% endhighlight %}

Note that it might have been installed automatically by the Additional Drivers app.

Now NVIDIA X Server Settings should show the menu for Prime Settings. Which graphic card is used can be configured there.

__BUT__ unfortunately, my system did not boot again after switching to Intel graphics with Prime.

I did tons of search and found the workaround: adding

<pre>acpi_rev_override=1</pre>

to the kernel boot parameter list. This can be done by editing `/etc/default/grub` __and__ then running `sudo update-grub`. This seems to be the only solution on an XPS 15 9560 - it works well, and does not disable your touchpad.

<br/>

## Installing Bumblebee

Note: on my laptop, bumblebee is not providing very satisfying performance. It _is_ providing some more fan noise when making use of my discrete card, though.

Note 2: to make bumblebee compatible with tlp, it would be the best to use tlp version 1.0: [https://github.com/linrunner/TLP/issues/244#issuecomment-272689534](https://github.com/linrunner/TLP/issues/244#issuecomment-272689534)

To install bumblebee, just run

{% highlight shell script %}
sudo apt install bumblebee
{% endhighlight %}

Then, follow the steps in [this post](http://www.webupd8.org/2016/08/how-to-install-and-configure-bumblebee.html) to configure `/etc/modprobe.d/bumblebee.conf` and `/etc/bumblebee/bumblebee.conf`.

After that, for me, I ran into the problem of

<pre>Cannot access secondary GPU - error: [XORG] (EE) Failed to load module "mouse" (module does not exist, 0)</pre>

when running optirun. I followed [this](https://github.com/Bumblebee-Project/Bumblebee/issues/867#issuecomment-302827439) to solve the problem.

<br/>

## Optirun or Primusrun?

Both commands are provided by bumblebee. The only difference to end users should be the names of two commands are different. It is said that the latter provides better performance.

__P.S.__ I reboot my laptop whenever I see some weird problems.

<br/>

## References

- [BinaryDriverHowto/Nvidia - Community Help Wiki](https://help.ubuntu.com/community/BinaryDriverHowto/Nvidia)
- [Fix lock up when switching off discrete graphics card in Dell XPS 9560 https://bugzilla.kernel.org/show_bug.cgi?id=156341 - Patchwork](https://patchwork.kernel.org/patch/9583765/)
- [Fixed Nvidia 1050 freezing in Ubuntu Linux! : Dell](https://www.reddit.com/r/Dell/comments/63cavx/fixed_nvidia_1050_freezing_in_ubuntu_linux/)
- [TLP conflicts with Bumblebee, disabling GPU until reboot · Issue #244 · linrunner/TLP](https://github.com/linrunner/TLP/issues/244#issuecomment-272689534)
- [Debian sid \[ERROR\]Cannot access secondary GPU - error: \[XORG\] (EE) Failed to load module "mouse" (module does not exist, 0) \[13433.797270\] \[ERROR\]Aborting because fallback start is disabled. · Issue #867 · Bumblebee-Project/Bumblebee](https://github.com/Bumblebee-Project/Bumblebee/issues/867#issuecomment-30)
