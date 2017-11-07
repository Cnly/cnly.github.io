---
title: gPassword - a Non-Storage Password Manager
tags: [default]
permalink: /gpw-about
---

There are already tons of password managers. But what most of them do, is storing your encrypted passwords on disk/cloud, and providing access after you authenticating yourself with your main key.

For people who don't even like seeing their passwords stored (in any form), this is not good.

gPassword (gPw) is a password manager that solves this problem. It's original idea was actually from another manager, [FlowerPassword](http://flowerpassword.com), which was released in 2011. (The letter 'g' in 'gPw' is the letter right after 'f' in 'FlowerPassword') After using FlowerPassword for some time, however, I would like to improve its design, because it:

- only generates 16-digit passwords
- only generates passwords containing __only__ `0-9`, `a-f`, `A-F`, and `K`
- ensures that the first letter is upper case
- has a Chrome extension that somehow allows evil sites to obtain users' password and/or key
- has an official Web app which is not protected by HTTPS
- has an Android version which only supports short keys
- does not have an official CLI version
- has seemed to be inactive for a long time

And these are the things gPw wants to fix. gPw is currently still under development, and will:

- generate up to __32-digit__ passwords, containing __numbers, letters, and punctuation marks__
- support Web, CLI, extension, and more platforms
- be able to sync keys with Chrome Syncing API (for Chrome extension; as an opt-in)
- provide library in multiple languages
- better meet modern security requirements
- be completely open source under the MIT License

For now, these resources may be useful:

- [Web App (hosted on github.io)](https://cnly.github.io/gpw)
- [gPw Chrome Extension Repo](https://github.com/Cnly/gpw-chrome)
- [gPw Web App Repo](https://github.com/Cnly/gpw-web)
- [gPw JS Lib Repo](https://github.com/Cnly/gpw-js)
- [gPw Python Lib Repo (CLI version included)](https://github.com/Cnly/gpw-python)

Feel free to submit issues/PRs if you are willing.
