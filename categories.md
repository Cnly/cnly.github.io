---
layout: page
title: Categories
permalink: /categories/
---

All categories
---

{% assign categories_list = site.categories %}
<ul class="list-unstyled">
  {% if categories_list.first[0] == null %}
    {% for category in categories_list %}
    <li>
      <a href="#{{ category | replace:' ','-' }}-ref" data-toggle="tab">
        {{ category | capitalize }} ({{ site.categories[category].size }})
     </a>
    </li>
    {% endfor %}
  {% else %}
    {% for category in categories_list %}
    <li>
      <a href="#{{ category[0] | replace:' ','-' }}-ref" data-toggle="tab">
        {{ category[0] | capitalize }} ({{ category[1].size }})
      </a>
    </li>
    {% endfor %}
  {% endif %}
</ul>
{% assign categories_list = nil %}
<br />

<!-- Tab panes -->
{% for category in site.categories %}
  <div id="{{ category[0] | replace:' ','-' }}-ref">
    <h3>{{ category[0] | capitalize }}</h3>
    <ul class="list-unstyled">
      {% assign pages_list = category[1] %}
      {% for node in pages_list %}
        {% if node.title != null %}
          <li style="line-height: 30px;"><a href="{{ site.BASE_PATH }}{{node.url}}">{{node.title}}</a> - {{ node.date | date: "%d %B, %Y" }}</li>
        {% endif %}
      {% endfor %}
      {% unless forloop.last %}
        <br />
      {% endunless %}
      {% assign pages_list = nil %}
    </ul>
  </div>
{% endfor %}
