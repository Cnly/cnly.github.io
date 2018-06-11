---
title: Building and Installing Latest MPTCP for Raspberry Pi
date: '2018-06-11T19:05:00+08:00'
tags:
  - raspi
  - tutorial
---
This post serves as the documentation for my script [`rpi-mptcp-build.sh`](https://gist.github.com/Cnly/1fff0279259122075e96692f3981e38c).

This script automatically fetches and builds MPTCP of the latest version for Raspberry Pi. It creates a single `.sh` install script with the MPTCP-enabled kernel `tar.xz` embedded inside, so it is super easy to install the compiled kernel on the Pi.

It is assumed in this post that the Pi runs Raspbian, and, if cross compiling, the compiling machine runs Ubuntu. Users of other distributions may want to modify the script.

To use this script, download it onto the compiling machine (either your computer or RasPi). It is recommended to do this in a new directory:

```
mkdir rpi-mptcp && cd rpi-mptcp
curl "https://gist.githubusercontent.com/Cnly/1fff0279259122075e96692f3981e38c/raw" -o rpi-mptcp-build.sh
```

Next, if you want to change kernel branch or MPTCP branch, or you are compiling for Pi 1, Pi 0, Pi 0 W, or Compute Module, open the script in a text editor and modify the variables at the start.

Now run the script:

```
./rpi-mptcp-build.sh
```

And the script will do these for you:

- Install dependencies `build-essential`, `git`, `bc` (requires root)
- If you are cross compiling, download [rpi-tools](https://github.com/raspberrypi/tools) (with shallow clone to save space)
- Fetch the given branches of [the official RasPi kernel](https://github.com/raspberrypi/linux) and [MPTCP](https://github.com/multipath-tcp/mptcp), and merge them
- Enable MPTCP in kernel build configuration
- Build the kernel
- Creates the single-file installer script

These steps take some time. Have some tea (or a nap, if you are compiling on the Pi), and `cd` into the `linux` folder when the script finishes its job. Here you should be able to find a file with name in the form of `rpi-x.xx.xx-xxx-mptcp.sh`, which is the installer script (more below).

You have two ways to use this `rpi-x.xx.xx-xxx-mptcp.sh`: (a) Run it directly on your running Pi, or (b) Mount your Pi's TF card on your computer, and run it there.

For option (a) Run it directly on your running Pi, all you need to do is send this file to your Pi (consider `python3 -m http.server`), and run it with sudo:

`sudo ./rpi-x.xx.xx-xxx-mptcp.sh`. (Remember to `sudo reboot` afterwards.) 

This will replace the Pi's kernel, while the original kernel image will be backed up at `/boot/kernel-original.img`.

For option (b) Mount your Pi's TF card on your computer, and run it there, you can run the script with an argument to tell it to extract the files there (without trailing slash) (no root required):

```
mkdir rpi-mptcp-extract
./rpi-x.xx.xx-xxx-mptcp.sh rpi-mptcp-extract
```

When mounting your TF card, note that there are (usually) two partitions: one in format FAT32, the other ext4.

Remember to backup your original kernel. 

Then, copy all files inside `rpi-mptcp-extract/boot` to the root of the FAT32 partition, and those inside `rpi-mptcp-extract/lib` to `/lib` of the ext4 partition.

The steps end here. You can now check if your Pi has MPTCP enabled with `sysctl net.mptcp.mptcp_enabled`.
