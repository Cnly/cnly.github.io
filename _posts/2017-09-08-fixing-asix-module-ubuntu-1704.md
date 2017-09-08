---
title: Fixing ASIX Kernel Module Crashing Ubuntu 17.04 when Resuming from Suspend on XPS 15 9560
tags: [xps-15-9560, ubuntu]
---

Recently I came across with a strange problem: my XPS dies sometimes when resuming from suspend. It's strange because I cannot tell when exactly does this happen, and that made debugging even harder. The most obvious pattern I observed was that this happens more frequently when I put the laptop to a night-long sleep. When I'm out in the day I tried from time to time to suspend/resume the laptop and nothing happened.

When the problem appeared, the first symptom would be the anomaly with Network Manager - it became unresponsive. Then when I looked into the `syslog`, I would find something like

    INFO: task NetworkManager:1009 blocked for more than 120 seconds.
    
following some lines of log from NetworkManager about things like network configuring.

Then I started to suspect something wrong with NetworkManager, and I tried some scripts from AskUbuntu to restart NetworkManager when resuming; no avail, however.

I also saw that the last few lines of log from NetworkManager was like

    Aug 30 23:53:06 <hidden> NetworkManager[1009]: <info>  [1504108386.1978] device (wlp2s0): set-hw-addr: set MAC address to 12:AD:D7:0D:4E:E7 (scanning)
    Aug 30 23:53:06 <hidden> NetworkManager[1009]: <info>  [1504108386.1985] device (enx<MAC Addr Hidden>): state change: unmanaged -> unavailable (reason 'managed') [10 20 2]
    
So I tried to turn off MAC randomization when scanning for WLAN networks but that also made no difference.

Then I tried to compare the logs from the crashing times with those from the normal times. But there's nothing 100% related to the problem.

I was stuck until I took a glance at the call trace under the line that reported the unresponsiveness of NetworkManager:

    Aug 30 23:55:10 <hidden> kernel: [72498.979739] NetworkManager  D    0  1009      1 0x00000000
    Aug 30 23:55:10 <hidden> kernel: [72498.979744] Call Trace:
    Aug 30 23:55:10 <hidden> kernel: [72498.979754]  __schedule+0x233/0x6f0
    Aug 30 23:55:10 <hidden> kernel: [72498.979757]  schedule+0x36/0x80
    Aug 30 23:55:10 <hidden> kernel: [72498.979761]  rpm_resume+0x121/0x6b0
    Aug 30 23:55:10 <hidden> kernel: [72498.979767]  ? wake_atomic_t_function+0x60/0x60
    Aug 30 23:55:10 <hidden> kernel: [72498.979770]  rpm_resume+0x2dc/0x6b0
    Aug 30 23:55:10 <hidden> kernel: [72498.979773]  __pm_runtime_resume+0x4e/0x80
    Aug 30 23:55:10 <hidden> kernel: [72498.979778]  usb_autopm_get_interface+0x22/0x60
    Aug 30 23:55:10 <hidden> kernel: [72498.979788]  usbnet_write_cmd+0x35/0x90 [usbnet]
    Aug 30 23:55:10 <hidden> kernel: [72498.979793]  asix_write_cmd+0x4e/0x80 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979799]  asix_set_sw_mii+0x28/0x60 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979802]  ? mutex_lock+0x12/0x40
    Aug 30 23:55:10 <hidden> kernel: [72498.979806]  asix_mdio_read+0x5e/0x160 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979811]  ? usb_runtime_suspend+0x70/0x70
    Aug 30 23:55:10 <hidden> kernel: [72498.979816]  mii_nway_restart+0x18/0x40 [mii]
    Aug 30 23:55:10 <hidden> kernel: [72498.979820]  ax88772_restore_phy+0x5b/0x70 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979824]  ax88772a_resume+0x32/0x40 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979829]  asix_resume+0x22/0x30 [asix]
    Aug 30 23:55:10 <hidden> kernel: [72498.979833]  usb_resume_interface.isra.8+0x99/0xf0
    Aug 30 23:55:10 <hidden> kernel: [72498.979837]  usb_resume_both+0x6a/0x130
    Aug 30 23:55:10 <hidden> kernel: [72498.979841]  usb_runtime_resume+0x1a/0x20
    
where `asix` was the kernel module for my USB-RJ45 adaptor. Then I tried the following solution:

* Before suspending, remove the module `asix`
* After resuming, if the adaptor is plugged in, load the module `asix`.

## The Solution

Scripts are as follows:

`/etc/systemd/system/asix-suspend.service`:
{% highlight Bash shell scripts %}
[Unit]
Description=Remove module asix before suspend
Before=suspend.target
Before=hibernate.target
Before=hybrid-sleep.target

[Service]
Type=oneshot
ExecStart=/sbin/modprobe -r asix

[Install]
WantedBy=suspend.target
WantedBy=hibernate.target
WantedBy=hybrid-sleep.target
{% endhighlight %}

`/etc/systemd/system/asix-resume.service`:
{% highlight Bash shell scripts %}
[Unit]
Description=Modprobe module asix after resume suspend
After=suspend.target
After=hibernate.target
After=hybrid-sleep.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c '/usr/bin/lsusb | /bin/grep -q "ASIX" && sudo /sbin/modprobe asix || exit 0'

[Install]
WantedBy=suspend.target
WantedBy=hibernate.target
WantedBy=hybrid-sleep.target
{% endhighlight %}

Note that in the second script, I had to use `/bin/sh -c` to get things work. This was because some special operators like `|`  in `ExecStart` are not recognized by systemd. For details, see [here](https://www.freedesktop.org/software/systemd/man/systemd.service.html):

> This syntax is inspired by shell syntax, but only the meta-characters and expansions described
> in the following paragraphs are understood, and the expansion of variables is different. Specifically, 
> redirection using "<", "<<", ">", and ">>", pipes using "|", running programs in the background using "&",
> and other elements of shell syntax are not supported.

After creating those two scripts, run `sudo systemctl enable asix-suspend.service` and `sudo systemctl enable asix-resume.service` to get them to work.

Next, when I tested the workaround with my adaptor, nothing went wrong this time!
