---
layout: page
title: Tags
permalink: /tags/
fa-icon: tags
---

{% capture site_tags %}{% for tag in site.tags %}{{ tag | first }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
{% assign tag_words = site_tags | split:',' | sort %}

<h3>All Tags</h3>
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
  <li class="tags-page-tag-list-item">
      <a href="#{{ this_word | replace:' ','-' }}-ref" data-toggle="tab">
        {{ this_word }}</a>
    <span class="grey">({{ site.tags[this_word].size }})</span>
  </li>
{% endunless %}{% endfor %}
<br />

<!-- Tab panes -->
{% assign last_item = site.tags.size | minus: 1 %}
{% for item in (0..site.tags.size) %}{% unless forloop.last %}
  {% capture this_word %}{{ tag_words[item] | strip_newlines }}{% endcapture %}
  <div id="{{ this_word | replace:' ','-' }}-ref">
    <h3><i class="fa fa-tag" style="margin-right: 3px;" aria-hidden="true"></i>{{ this_word }}</h3>
      {% for post in site.tags[this_word] %}{% if post.title != null %}
    {% if post.red %}
        <li style="line-height: 30px;"><a class="red" href="{{ site.BASE_PATH }}{{post.url}}">{{post.title}}</a> <span class="grey">- {{ post.date | date: "%d %B, %Y" }}</span></li>
    {% else %}
        <li style="line-height: 30px;"><a href="{{ site.BASE_PATH }}{{post.url}}">{{post.title}}</a> <span class="grey">- {{ post.date | date: "%d %B, %Y" }}</span></li>
    {% endif %}
      {% endif %}{% endfor %}
      {% unless item == last_item %}
        <br />
      {% endunless %}
  </div>
{% endunless %}{% endfor %}
