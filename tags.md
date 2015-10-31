---
layout: page
title: Tags
permalink: /tags/
---

{% capture site_tags %}{% for tag in site.tags %}{{ tag | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign tag_words = site_tags | split:',' | sort %}

All tags
---
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
  <li>
      <a href="#{{ this_word | replace:' ','-' }}-ref" data-toggle="tab">
        {{ this_word }} ({{ site.tags[this_word].size }})
     </a>
  </li>
{% endunless %}{% endfor %}
<br />

<!-- Tab panes -->
{% assign last_item = site.tags.size | minus: 1 %}
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
