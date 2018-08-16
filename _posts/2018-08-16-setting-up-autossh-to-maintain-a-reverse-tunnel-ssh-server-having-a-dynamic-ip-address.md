---
title: >-
  Setting Up autossh to Maintain a Reverse Tunnel (SSH Server Having a Dynamic
  IP Address)
date: '2018-08-16T16:54:11+08:00'
tags:
  - tutorial
---
I have bumped into several obstacles in the process of setting up an autossh reverse tunnel, so I'm writing this post to cover the process itself, as well as some other things to pay attention to during the process.

A not-too-old version of Ubuntu is assumed both for the client (the machine with autossh) and the server (the machine that the client will connect to).

<br>

## Installing autossh

This is just a one-liner:

```
sudo apt install -y autossh
```

<br>


## Setting Up SSH Environment

For security reasons, we are setting up a dedicated user for the SSH tunnel on the server.

```
sudo useradd -s /bin/true -m sshtunuser
```

Specifying `/bin/true` as a user's shell prohibits them from running anything yet still allows them to create a tunnel. ([Source](https://unix.stackexchange.com/questions/14312/how-to-restrict-an-ssh-user-to-only-allow-ssh-tunneling))

The `-m` option creates the new user's home directory so we can put the public key we'll have later into `~sshtunuser/.ssh/authorized_keys`.

The next step is to generate a public/private key pair, and put the public key into `~sshtunuser/.ssh/authorized_keys`. Make sure the right permissions are applied:

```
sudo chown -R sshtunuser:sshtunuser ~sshtunuser/.ssh
sudo chmod 700 ~sshtunuser/.ssh
sudo chmod 600 ~sshtunuser/.ssh/authorized_keys
```

We'll also need to set `GatewayPorts yes` and `ClientAliveInterval 15` in `/etc/ssh/sshd_config` on the server.

The first option allows SSH clients to listen to a port with IP addresses other than localhost, and the second tells the server to ensure the client is still alive every 15 seconds.

Do a `sudo systemctl restart ssh` to make sure new options are taken without error.

<br>

## Creating a systemd Service on the Client

Here I am assuming we will tell the server to 

```
sudo touch /etc/systemd/system/autossh.service

cat << EOF | sudo tee /etc/systemd/system/autossh.service
[Unit]
Description=Autossh
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=0

[Service]
User=you
ExecStart=/usr/bin/autossh -M 0 -R 10022:localhost:22 -p 1122 -N -o "ServerAliveInterval 15" -o "ServerAliveCountMax 3" -o "ConnectTimeout 10" -o "ExitOnForwardFailure yes" -i /home/you/.ssh/yourkey sshtunuser@server.com
Restart=always
RestartSec=1

[Install]
WantedBy=multi-user.target
EOF
```

A brief explanation on the service file and autossh arguments:

- `StartLimitIntervalSec=0`: The option that tells systemd not to stop after some restart attempts. May also be `StartLimitInterval=0` on some older versions of systemd.
- `Restart=always`: Always restart the service no matter what exit code is returned.
- `RestartSec=1`: Wait 1 seconds before restarting.

<br>

- `-M 0`: Disables the "base monitoring port" for autossh itself.
- `-R 10022:localhost:22 -p 1122`: Some common arguments that are passed to the ssh program.
- `-o "ServerAliveInterval 15" -o "ServerAliveCountMax 3" -o "ConnectTimeout 10"`: Arguments passed to the ssh program that allow faster discovery of broken connection and faster timeout.
- `-o "ExitOnForwardFailure yes"`: Without this option, if the ssh client is able to establish the connection but unable to setup a listening port, it will remain running instead of returning an error exit code.

Now enable the service:
```
sudo systemctl enable --now autossh
```

And we're done.

<br>

## 
