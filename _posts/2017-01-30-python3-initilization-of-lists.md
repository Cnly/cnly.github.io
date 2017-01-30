---
title: Python [3] 中一个小坑：创建定长列表
tags: [python]
---

{% highlight python %}
lst = [[]] * 48
{% endhighlight %}

如果用上面的方法创建，则列表内的48个列表，都会指向同一个引用。如果没有注意这一点，可能会在操作这个二维列表时出现“明明只操作了其中某个，却变成48个列表都有”的情况。

可选的正确姿势：
{% highlight python %}
lst = [[] for i in range(48)]
{% endhighlight %}
