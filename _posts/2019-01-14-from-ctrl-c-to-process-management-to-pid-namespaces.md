---
title: From Ctrl-C to Process Management to PID Namespaces
date: '2019-01-14T23:42:52+08:00'
tags:
  - linux
---
The other day I was trying to manage a bunch of processes when I found that they are not starting and stopping the way I expected. So I thought the time might have come when I should make these things clear for myself.

We probably press Ctrl-C to interrupt programs every day, just not knowing what's really going on behind the scenes. For this reason, I decided to start from `^C` - a familiar stranger.

Here we'll look into the most (?) common setup. When we press Ctrl-C, our *terminal emulator* (or a real *terminal*, if you're using one) sends the non-printable ASCII character `ETX` ("end of text") to the *tty* driver. Then, tty knows that it should send a `SIGINT` to the *foreground process group*.

### The terminal things

For those who are not familiar with these terminal things (like me), the last paragraph may seem confusing, so I'm including a brief introduction here. A long time ago, people use real [terminals](https://en.wikipedia.org/wiki/VT100) to interact with computers. In modern times, they have been phased out and people now use [terminal emulators](https://en.wikipedia.org/wiki/Terminal_emulator), examples including gnome-terminal and Konsole. But in kernel, both kinds of terminals have generally been using the one big driver - [tty](https://elixir.bootlin.com/linux/latest/source/drivers/tty).

For a deeper understanding on tty, consider this great article: [The TTY demystified](https://www.linusakesson.net/programming/tty/).

The next question is: what does it mean for tty to send a `SIGINT` to the *foreground process group*? Let's take a look at some concepts related to process and session management in Linux.

### The process things

A *process* has a parent process, and is associated with a *process group* which is then associated with a *session*.

**Parent process.** A process can either have another process as its parent, or have kernel as its parent. In the latter case, its PPID (parent PID) will be `0`. Another case somewhat special appears when a process has a PPID of `1`, aka the `init` process. In this case, it's true that the `init` has really spawned that process, but it's also possible that the original parent of that process died before it does, resulting in that process's being *re-parented* to the `init` process. Note that when a parent process dies, its children don't necessarily die. Sometimes because a parent kills its children when it receives a termination signal, it *looks like* that killing a parent also kills its children.

There's another relevant term that we may see from time to time without understanding it: *zombie process*. For a process that has exited, if its parent isn't explicitly ignoring the `SIGCHLD` signal by calling `signal(SIGCHLD, SIG_IGN)` AND isn't going to read the exit status of that process by calling `wait()` on the process, then the process becomes a zombie process, lingering as an entry in the process table.

**Process group.** Basically, a *process group* is used for the distribution of signals. That said, while a signal like `SIGINT` can be sent to one specific process, it can also be sent to a process group, signalling every process in that group. Oftentimes, a shell *job* is a shell representation of a process group.

**Session.** A session... is a session. It may or may not be managed by a tty. There may of course be many sessions on a running system. Traditionally when a terminal connection dies, its tty driver sends a `SIGHUP` to all processes running in the session managed by it, terminating all of the processes by default.

When a session managed by a tty is still running, the tty keeps track of various kinds of information about the running processes. Among them, tty keeps records of the *foreground process group*, literally the group of processes that are running in the foreground and are allowed to read and write from the tty. That's where the concept *foreground process group* came.

So when we press Ctrl-C, all processes in the foreground process group receives `SIGINT`. By default, they'll be terminated, but if they wanted to survive, they can still do so. For example, they can ignore `SIGINT`. Or, if they are spawned by their parents into a new process group or a new session (by calling `setpgid()` or `setsid()`), they won't receive this signal.

A side note: Calls to `setpgid()` and `setsid()` can't be arbitrary. For instance, `setpgid()` will only work if the calling process is trying to move itself or one of its children to another process group inside the same session. Some more details can be obtained through `man 2 setpgid` and `man 2 setsid`.

As we've sorted out how Ctrl-C works to interrupt processes, we've also got to know how processes are organized in the system - they are associated with "environments" like sessions and process groups. But, on one hand, while processes can make use of these concepts to accomplish goals like surviving after terminal hangup, on the other hand, the fact that processes can easily "escape" their fate of being killed also brings *us* trouble when sometimes we want to make sure that nothing is left behind us. And this is where PID namespaces come into play.

### PID namespaces

A PID namespace, as suggested by its name, provides an isolated process ID number space. A process can use `clone()` or `unshare()` with the `CLONE_NEWPID` flag to create a new PID namespace. Similar to other types of namespaces, when all processes in a PIDNS have exited and there is no reference to this namespace (created by bind mounting a file in `/proc/[PID]/ns/` to somewhere else), the PIDNS terminates.

When it comes to running processes inside a PIDNS, it's better to have some knowledge about process management, which is already mentioned above, and some about the `init` process, which we'll introduce shortly.

An `init` process is the first process run by kernel, and it always has the PID `1`. In Linux, the process with PID `1` is treated specially by the system. In our context:

- The `kill` system call (`man 2 kill`), used for signal sending, allows only the signals for which `init` has explicitly installed handlers to be sent to `init`.
- The whole system dies when `init` exits. Inside a PIDNS, if `init` terminates, kernel terminates all of the processes in the namespace with `SIGKILL`.
- For an `init` inside a PIDNS, it's the same that `kill` won't deliver unwanted signals, regardless of sending from within or outside the namespace. However, when sending from an ancestor namespace, `SIGKILL` and `SIGSTOP` are exception: They will result in the usual actions of the signals, and they can't be caught by the `init`.

With all of these, we need to keep in mind two things when we run processes inside a PIDNS. First, we need to start a proper program to be the `init` because it takes the responsibility to reap zombie processes. Most of the time, a shell should do the job. Second, we can utilize `SIGKILL` to terminate the `init` of a PIDNS from an ancestor NS, thus killing all running processes in that NS, which satisfies our need of a perfect cleanup after us.

As this post is not going to include in great details how to play with PID namespaces, I'll stop here. For curious readers, you may want: `man unshare`, `man nsenter`, `man pid_namespaces`, and google.

### References

- [The TTY demystified](https://www.linusakesson.net/programming/tty/)
- [Using pseudo-terminals to control interactive programs, pty, pdip](http://rachid.koucha.free.fr/tech_corner/pty_pdip.html)
- [terminal - difference between pty and a pipe - Stack Overflow](https://stackoverflow.com/questions/26659595/difference-between-pty-and-a-pipe)
- [session - Is there a way to change the process group of a running process? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/462188/is-there-a-way-to-change-the-process-group-of-a-running-process)
- [Linux kernel action upon init process exiting - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/195889/linux-kernel-action-upon-init-process-exiting)
- [The Curious Case of Pid Namespaces – Hacker Noon](https://hackernoon.com/the-curious-case-of-pid-namespaces-1ce86b6bc900)
- [Zombie process - Wikipedia](https://en.wikipedia.org/wiki/Zombie_process)
- [Namespaces in operation, part 2: the namespaces API \[LWN.net\]](https://lwn.net/Articles/531381/)
