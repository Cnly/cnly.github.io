---
title: 在Ubuntu 17.04下交换Ctrl、Alt、Win键（布局）并避免输入法问题
tags: [ubuntu]
---

看看苹果键盘的布局，我觉得它左下角功能区按键的配置更为合理。

![Apple Keyboard Layout](https://imgur.com/vGTNXQm.png)

于是找了一些资料，把Ubuntu 17.04下的功能键映射改了。目前的配置：

- 物理`Ctrl`键作为`Super`
- 物理`Super`键作为`Alt`
- 物理`Alt`键作为`Ctrl`
- IBus输入法没有问题

## 配置过程

首先想好新配置应该是什么样的，然后到

<pre>
/usr/share/X11/xkb/rules/base.lst
</pre>

里面的`!option`区域找一个合适的配置（大多配置都可以在这里找到）

接下来通过Dash打开Startup Applications，添加一条命令：

{% highlight shell script %}
setxkbmap -option ctrl:swap_lalt_lctl_lwin
{% endhighlight %}

如果你的配置与我不同，其中的`ctrl:swap_lalt_lctl_lwin`应该被替换为你所选的配置。

然后进入设置里的Text Entry，禁用切换输入法的快捷键。

再通过一个自己写的Bash script实现切换输入法的功能。文件见：

[这里](https://gist.github.com/Cnly/d462290ca5756c4bec0c2f67cb4cd6e5)

其中倒数第二行的`sleep`用于防止IBus切换输入法后将布局改回默认。`0.05`是一个在我的电脑上可以使脚本稳定运行的数值，你可能需要根据自己的测试结果进行调整。脚本的最后一行是那条更改键盘布局的命令，可以自行调整。

最后，在设置的Keyboard Settings里新键两个快捷键，分别将它们的命令设为

{% highlight shell script %}
/path/to/xkbwime.sh prev
{% endhighlight %}

和

{% highlight shell script %}
/path/to/xkbwime.sh next
{% endhighlight %}

这两条命令分别是切换至上一、下一输入法。

现在用快捷键切换一下输入法，应该就可以看见效果了。
