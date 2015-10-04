---
title: HTTPS重定向
---

github.io有HTTPS版本，于是给本站加了个自动重定向

{% highlight javascript %}
if (window.location.host.indexOf('github.io') > -1 && window.location.protocol != "https:"){
    window.location.protocol = "https";
}
{% endhighlight %}

*坑爹，gist.github.com都被和谐了*
