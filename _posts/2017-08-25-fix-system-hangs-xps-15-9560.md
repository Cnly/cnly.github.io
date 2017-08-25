---
title: Fixing System Hangs when AC Plugged in or Doing lspci on XPS 15 9560
tags: [xps-15-9560, ubuntu]
---

I am on my XPS 15 9560 with Ubuntu 17.04 and I experienced a bug as described in the title. My settings:

* nVidia proprietary drivers NOT installed
* using Intel Graphics only(to save power)
* TLP installed, with stock configuration

## TL;DR

I added `nouveau.modeset=0` to grub command line, did `update-grub` and the problem was gone.

## The Bug

When the system hangs after AC plugged in(maybe not instantly), I can see a `kworker` occupying 100% CPU in `top`, and the system load increases rapidly. At this time, mouse freezes but I can still use keyboard to look around. There are chances when the system freezes completely later, though. However, there doesn't seem to be a way to recover, except force rebooting the machine with power button. If I try rebooting through `sudo reboot`, the system freezes completely.

Some logs:

After AC is plugged in:

    Aug 25 00:50:12 <hidden> kernel: [ 1291.717331] nouveau 0000:01:00.0: Refused to change power state, currently in D3
    Aug 25 00:50:12 <hidden> kernel: [ 1291.717350] nouveau 0000:01:00.0: Refused to change power state, currently in D3
    Aug 25 00:50:12 <hidden> kernel: [ 1291.717354] nouveau 0000:01:00.0: DRM: resuming kernel object tree...

Things start to get strange after the last log above.

Then, there will be:

    NMI watchdog: BUG: soft lockup - CPU#7 stuck for 22s! [kworker/7:0:3806]
    
followed by a ton of things looking related to `nouveau`, `PCI Runtime PM`, and so on:

    Aug 25 00:50:37 <hidden> kernel: [ 1317.082543] Call Trace:
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082564]  ? nv04_timer_read+0x35/0x60 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082579]  nvkm_timer_read+0xf/0x20 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082593]  nvkm_pmu_reset+0x71/0x160 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082594]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082607]  nvkm_pmu_preinit+0x12/0x20 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082615]  nvkm_subdev_preinit+0x34/0x110 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082630]  nvkm_device_init+0x62/0x280 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082630]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082644]  nvkm_udevice_init+0x48/0x60 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082652]  nvkm_object_init+0x40/0x190 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082653]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082660]  nvkm_object_init+0xb4/0x190 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082661]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082668]  nvkm_client_init+0xe/0x10 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082683]  nvkm_client_resume+0xe/0x10 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082690]  nvif_client_resume+0x17/0x20 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082705]  nouveau_do_resume+0x4b/0x130 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082705]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082719]  nouveau_pmops_runtime_resume+0x78/0x150 [nouveau]
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082720]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082720]  pci_pm_runtime_resume+0x7b/0xa0
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082721]  __rpm_callback+0xc4/0x200
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082722]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082723]  rpm_callback+0x24/0x80
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082723]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082724]  rpm_resume+0x4ac/0x6b0
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082725]  pm_runtime_work+0x58/0xa0
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082726]  process_one_work+0x1fc/0x4b0
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082727]  worker_thread+0x4b/0x500
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082728]  kthread+0x109/0x140
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082729]  ? process_one_work+0x4b0/0x4b0
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082730]  ? kthread_create_on_node+0x60/0x60
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082731]  ret_from_fork+0x2c/0x40
    Aug 25 00:50:37 <hidden> kernel: [ 1317.082732] Code: 03 00 77 25 48 81 ff 00 00 01 00 76 05 0f b7 d7 ed c3 55 48 c7 c6 21 9b ec 94 48 89 e5 e8 19 ff ff ff b8 ff ff ff ff 5d c3 8b 07 <c3> 0f 1f 44 00 00 66 2e 0f 1f 84 00 00 00 00 00 48 81 fe ff ff 

Since I have TLP installed, and the problem seems to be related to power, I tried doing the following modifications in TLP's config file:

* `RUNTIME_PM_ON_AC=on` changed to `RUNTIME_PM_ON_AC=auto`
* `RUNTIME_PM_DRIVER_BLACKLIST="radeon nouveau"` changed to `RUNTIME_PM_DRIVER_BLACKLIST="radeon"`

That seemed to fix the problem... for a while, until I ran `lspci`. And the system freezes again. This time it was:

    Aug 25 11:06:57 <hidden> kernel: [ 4029.774064] nouveau 0000:01:00.0: Refused to change power state, currently in D3
    Aug 25 11:06:58 <hidden> kernel: [ 4029.834358] nouveau 0000:01:00.0: Refused to change power state, currently in D3
    Aug 25 11:06:58 <hidden> kernel: [ 4029.834364] nouveau 0000:01:00.0: Refused to change power state, currently in D3
    Aug 25 11:06:58 <hidden> kernel: [ 4029.834366] nouveau 0000:01:00.0: DRM: resuming kernel object tree...
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805524] NMI watchdog: BUG: soft lockup - CPU#2 stuck for 23s! [lspci:9716]
    
and:

    Aug 25 11:07:24 <hidden> kernel: [ 4055.805572] Call Trace:
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805593]  ? nv04_timer_read+0x22/0x60 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805609]  nvkm_timer_read+0xf/0x20 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805623]  nvkm_pmu_reset+0x71/0x160 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805624]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805638]  nvkm_pmu_preinit+0x12/0x20 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805646]  nvkm_subdev_preinit+0x34/0x110 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805661]  nvkm_device_init+0x62/0x280 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805662]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805676]  nvkm_udevice_init+0x48/0x60 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805685]  nvkm_object_init+0x40/0x190 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805685]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805693]  nvkm_object_init+0xb4/0x190 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805694]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805702]  nvkm_client_init+0xe/0x10 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805718]  nvkm_client_resume+0xe/0x10 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805725]  nvif_client_resume+0x17/0x20 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805741]  nouveau_do_resume+0x4b/0x130 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805741]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805756]  nouveau_pmops_runtime_resume+0x78/0x150 [nouveau]
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805757]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805757]  pci_pm_runtime_resume+0x7b/0xa0
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805758]  __rpm_callback+0xc4/0x200
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805759]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805760]  rpm_callback+0x24/0x80
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805761]  ? pci_restore_standard_config+0x40/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805761]  rpm_resume+0x4ac/0x6b0
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805762]  pm_runtime_barrier+0x97/0xb0
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805763]  pci_config_pm_runtime_get+0x3b/0x60
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805764]  pci_read_config+0x8f/0x280
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805765]  sysfs_kf_bin_read+0x4a/0x70
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805766]  kernfs_fop_read+0xae/0x180
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805767]  __vfs_read+0x18/0x40
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805768]  vfs_read+0x96/0x130
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805769]  SyS_pread64+0x95/0xb0
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805770]  entry_SYSCALL_64_fastpath+0x1e/0xad
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805771] RIP: 0033:0x7f007a530e73
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805771] RSP: 002b:00007ffc3b3c7928 EFLAGS: 00000246 ORIG_RAX: 0000000000000011
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805772] RAX: ffffffffffffffda RBX: 0000000000000003 RCX: 00007f007a530e73
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805773] RDX: 0000000000000040 RSI: 0000563d2244d200 RDI: 0000000000000003
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805773] RBP: 0000000000000000 R08: 00007f007aa218d2 R09: 0000000000000028
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805773] R10: 0000000000000000 R11: 0000000000000246 R12: 00007ffc3b3c7030
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805774] R13: 0000563d22456630 R14: 0000563d2244d1d0 R15: 0000563d2244d010
    Aug 25 11:07:24 <hidden> kernel: [ 4055.805774] Code: 03 00 77 25 48 81 ff 00 00 01 00 76 05 0f b7 d7 ed c3 55 48 c7 c6 21 9b 0c 89 48 89 e5 e8 19 ff ff ff b8 ff ff ff ff 5d c3 8b 07 <c3> 0f 1f 44 00 00 66 2e 0f 1f 84 00 00 00 00 00 48 81 fe ff ff 

Well, then seems power management only is not to blame. Since there were the PCI device `0000:01:00.0` everywhere, I looked it up and found it was my nVidia card. Also, I found something looking relevant in `syslog`:

    Aug 25 00:51:45 <hidden> kernel: [    2.397098] [drm] Initialized
    Aug 25 00:51:45 <hidden> kernel: [    2.401325] scsi host0: ahci
    Aug 25 00:51:45 <hidden> kernel: [    2.401474] scsi host1: ahci
    Aug 25 00:51:45 <hidden> kernel: [    2.401520] ata1: DUMMY
    Aug 25 00:51:45 <hidden> kernel: [    2.401522] ata2: SATA max UDMA/133 abar m2048@0xed133000 port 0xed133180 irq 125
    Aug 25 00:51:45 <hidden> kernel: [    2.413938] [drm] Memory usable by graphics device = 4096M
    Aug 25 00:51:45 <hidden> kernel: [    2.413940] checking generic (80000000 7f0000) vs hw (80000000 10000000)
    Aug 25 00:51:45 <hidden> kernel: [    2.413940] fb: switching to inteldrmfb from EFI VGA
    Aug 25 00:51:45 <hidden> kernel: [    2.413954] Console: switching to colour dummy device 80x25
    Aug 25 00:51:45 <hidden> kernel: [    2.414003] [drm] Replacing VGA console driver
    Aug 25 00:51:45 <hidden> kernel: [    2.416898] MXM: GUID detected in BIOS
    Aug 25 00:51:45 <hidden> kernel: [    2.416919] ACPI Warning: \_SB.PCI0.GFX0._DSM: Argument #4 type mismatch - Found [Buffer], ACPI requires [Package] (20160930/nsarguments-95)
    Aug 25 00:51:45 <hidden> kernel: [    2.416956] ACPI Warning: \_SB.PCI0.PEG0.PEGP._DSM: Argument #4 type mismatch - Found [Buffer], ACPI requires [Package] (20160930/nsarguments-95)
    Aug 25 00:51:45 <hidden> kernel: [    2.416988] ACPI Warning: \_SB.PCI0.PEG0.PEGP._DSM: Argument #4 type mismatch - Found [Buffer], ACPI requires [Package] (20160930/nsarguments-95)
    Aug 25 00:51:45 <hidden> kernel: [    2.417108] pci 0000:01:00.0: optimus capabilities: enabled, status dynamic power, 
    Aug 25 00:51:45 <hidden> kernel: [    2.417109] VGA switcheroo: detected Optimus DSM method \_SB_.PCI0.PEG0.PEGP handle
    Aug 25 00:51:45 <hidden> kernel: [    2.417110] nouveau: detected PR support, will not use DSM
    Aug 25 00:51:45 <hidden> kernel: [    2.417123] nouveau 0000:01:00.0: enabling device (0006 -> 0007)
    Aug 25 00:51:45 <hidden> kernel: [    2.417255] nouveau 0000:01:00.0: NVIDIA GP107 (137000a1)
    Aug 25 00:51:45 <hidden> kernel: [    2.419405] [drm] Supports vblank timestamp caching Rev 2 (21.10.2013).
    Aug 25 00:51:45 <hidden> kernel: [    2.419406] [drm] Driver supports precise vblank timestamp query.
    Aug 25 00:51:45 <hidden> kernel: [    2.425933] [drm] Finished loading i915/kbl_dmc_ver1_01.bin (v1.1)
    Aug 25 00:51:45 <hidden> kernel: [    2.437219] i915 0000:00:02.0: vgaarb: changed VGA decodes: olddecodes=io+mem,decodes=io+mem:owns=io+mem
    Aug 25 00:51:45 <hidden> kernel: [    2.443569] [drm] GuC firmware load skipped
    Aug 25 00:51:45 <hidden> kernel: [    2.451361] nouveau 0000:01:00.0: bios: version 86.07.3e.00.1c
    Aug 25 00:51:45 <hidden> kernel: [    2.463928] usb 1-4: New USB device found, idVendor=0cf3, idProduct=e301
    Aug 25 00:51:45 <hidden> kernel: [    2.463948] usb 1-4: New USB device strings: Mfr=0, Product=0, SerialNumber=0
    Aug 25 00:51:45 <hidden> kernel: [    2.507551] nouveau 0000:01:00.0: fb: 4096 MiB GDDR5
    Aug 25 00:51:45 <hidden> kernel: [    2.507564] nouveau 0000:01:00.0: priv: HUB0: 00d054 00000007 (1f408216)
    Aug 25 00:51:45 <hidden> kernel: [    2.507617] nouveau 0000:01:00.0: priv: HUB0: 10ecc0 ffffffff (1e408227)
    Aug 25 00:51:45 <hidden> kernel: [    2.508872] vga_switcheroo: enabled
    Aug 25 00:51:45 <hidden> kernel: [    2.508971] [TTM] Zone  kernel: Available graphics memory: 8074764 kiB
    Aug 25 00:51:45 <hidden> kernel: [    2.508972] [TTM] Zone   dma32: Available graphics memory: 2097152 kiB
    Aug 25 00:51:45 <hidden> kernel: [    2.508972] [TTM] Initializing pool allocator
    Aug 25 00:51:45 <hidden> kernel: [    2.508974] [TTM] Initializing DMA pool allocator
    Aug 25 00:51:45 <hidden> kernel: [    2.508981] nouveau 0000:01:00.0: DRM: VRAM: 4096 MiB
    Aug 25 00:51:45 <hidden> kernel: [    2.508981] nouveau 0000:01:00.0: DRM: GART: 1048576 MiB
    Aug 25 00:51:45 <hidden> kernel: [    2.508983] nouveau 0000:01:00.0: DRM: BIT table 'A' not found
    Aug 25 00:51:45 <hidden> kernel: [    2.508983] nouveau 0000:01:00.0: DRM: BIT table 'L' not found
    Aug 25 00:51:45 <hidden> kernel: [    2.508984] nouveau 0000:01:00.0: DRM: Pointer to TMDS table invalid
    Aug 25 00:51:45 <hidden> kernel: [    2.508984] nouveau 0000:01:00.0: DRM: DCB version 4.1
    Aug 25 00:51:45 <hidden> kernel: [    2.508985] nouveau 0000:01:00.0: DRM: Pointer to flat panel table invalid
    Aug 25 00:51:45 <hidden> kernel: [    2.611445]  nvme0n1: p1 p2 p3 p4 p5 p6 p7
    Aug 25 00:51:45 <hidden> kernel: [    2.619353] random: fast init done
    Aug 25 00:51:45 <hidden> kernel: [    2.655190] nouveau 0000:01:00.0: hwmon_device_register() is deprecated. Please convert the driver to use hwmon_device_register_with_info().
    Aug 25 00:51:45 <hidden> kernel: [    2.720109] ata2: SATA link down (SStatus 4 SControl 300)
    Aug 25 00:51:45 <hidden> kernel: [    2.776405] nouveau 0000:01:00.0: DRM: failed to create kernel channel, -22
    Aug 25 00:51:45 <hidden> kernel: [    2.793628] [drm] Initialized nouveau 1.3.1 20120801 for 0000:01:00.0 on minor 1
    Aug 25 00:51:45 <hidden> kernel: [    2.951229] ACPI: Video Device [GFX0] (multi-head: yes  rom: no  post: no)
    Aug 25 00:51:45 <hidden> kernel: [    2.952063] input: Video Bus as /devices/LNXSYSTM:00/LNXSYBUS:00/PNP0A08:00/LNXVIDEO:00/input/input7
    Aug 25 00:51:45 <hidden> kernel: [    2.952216] ACPI: Video Device [PEGP] (multi-head: no  rom: yes  post: no)
    Aug 25 00:51:45 <hidden> kernel: [    2.952256] input: Video Bus as /devices/LNXSYSTM:00/LNXSYBUS:00/PNP0A08:00/device:0a/LNXVIDEO:01/input/input8
    Aug 25 00:51:45 <hidden> kernel: [    2.952422] [drm] Initialized i915 1.6.0 20161121 for 0000:00:02.0 on minor 0
    Aug 25 00:51:45 <hidden> kernel: [    2.973664] fbcon: inteldrmfb (fb0) is primary device
    Aug 25 00:51:45 <hidden> kernel: [    2.973718] Console: switching to colour frame buffer device 240x67
    Aug 25 00:51:45 <hidden> kernel: [    2.973734] i915 0000:00:02.0: fb0: inteldrmfb frame buffer device

It seems that the nVidia card is being initialized during kernel boot. So I tried disallowing this by adding `nouveau.modeset=0` to the grub command line. And things are fixed.

However, I still don't know how exactly things worked... Hopefully they'll be clearer as time pass by.:)
