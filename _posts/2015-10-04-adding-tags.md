---
title: 为Jekyll默认模板增加按照Tags分类功能
tags: [this, default]
date: 2015-10-04 23:38+0800
---

Jekyll默认主题无法按照tags为文章分类，于是打算自己加上这个功能。

找了一个带tags分类的主题作为参考：[dbyll](https://github.com/dbtek/dbyll/blob/master/tags.html)。

(MIT License)

> The MIT License (MIT)  
  Copyright (c) 2013 İsmail Demirbilek  
  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
  the Software, and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  
首先在根目录下创建一个`tags.md`，作为一个page。

初始化tags.md并把dbyll的tags.html中的内容复制过来:

{% highlight html %}{% raw %}
---
layout: page
title: Tags
---

{% capture site_tags %}{% for tag in site.tags %}{{ tag | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign tag_words = site_tags | split:',' | sort %}

<div class="col-sm-3 col-xs-6">
    <ul class="nav nav-tabs-vertical">
    {% for item in (0..site.tags.size) %}{% unless forloop.last %}
      {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
      <li>
          <a href="#{{ this_word | replace:' ','-' }}-ref" data-toggle="tab">
            {{ this_word }}<span class="badge pull-right">{{ site.tags[this_word].size }}</span>
         </a>
      </li>
   {% endunless %}{% endfor %}
   </ul>
</div>
<!-- Tab panes -->
<div class="tab-content col-sm-9 col-xs-6">
  {% for item in (0..site.tags.size) %}{% unless forloop.last %}
    {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
    <div class="tab-pane" id="{{ this_word | replace:' ','-' }}-ref">
      <h2 style="margin-top: 0px">Posts tagged  with {{ this_word }}</h2>
      <ul class="list-unstyled">
        {% for post in site.tags[this_word] %}{% if post.title != null %}
          <li style="line-height: 35px;"><a href="{{ site.BASE_PATH }}{{post.url}}">{{post.title}}</a> <span class="text-muted">- {{ post.date | date: "%B %d, %Y" }}</span></li>
        {% endif %}{% endfor %}
      </ul>
    </div>
  {% endunless %}{% endfor %}
</div>

<div class="clearfix"></div>
{% endraw %}{% endhighlight %}

删除无用的样式，并调整一下格式：
{% highlight html %}{% raw %}
---
layout: page
title: Tags
---

{% capture site_tags %}{% for tag in site.tags %}{{ tag | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign tag_words = site_tags | split:',' | sort %}

All tags
---
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
  <li>
      <a href="#{{ this_word | replace:' ','-' }}-ref" data-toggle="tab">
        {{ this_word }} ({{ site.tags[this_word].size }})</span>
     </a>
  </li>
{% endunless %}{% endfor %}
<br />

<!-- Tab panes -->
{% assign last_item = site.tags.size | minus: 1 %} # 这里比较坑，必须先把size - 1的结果先分配给一个变量，因为后面不能直接写{% unless item == {{ site.tags.size | minus: 1 }} %}
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
  <div id="{{ this_word | replace:' ','-' }}-ref">
    <h3>{{ this_word }}</h3>
      {% for post in site.tags[this_word] %}{% if post.title != null %}
        <li style="line-height: 30px;"><a href="{{ site.BASE_PATH }}{{post.url}}">{{post.title}}</a> - {{ post.date | date: "%d %B, %Y" }}</li>
      {% endif %}{% endfor %}
      {% unless item == last_item %}
        <br />
      {% endunless %}
  </div>
{% endunless %}{% endfor %}
{% endraw %}{% endhighlight %}

然而事情还没有结束，我们还需要在每个post中显示该post所带的tags。
打开`_layouts/post.html`，在日期和作者栏下面加入以下代码：
{% highlight html %}{% raw %}
<p class="post-meta">Tags • 
{% for item in page.tags %}
  <a href="{{ baseurl }}/tags.html#{{ item }}-ref">{{ item }}</a>
{% endfor %}
</p>
{% endraw %}{% endhighlight %}

如果在底部也需要显示，可以在底部也加入以上代码。

至此代码写完了。如果需要为一篇文章加上tag，只需要在文章的front matter区域加上

    tags: this
    tags: [this, that]
    # 两者任选其一即可
    
即可

[成品：Tags](/tags.html)
