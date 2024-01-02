---
layout: default
permalink: /blog/
---

<h1>Latest Blog Posts</h1>
{% for post in site.posts %}
    <p>{{ post.date | date_to_string }}</p>
    <h3><a href="{{ post.url }}">{{ post.title }}</a></h3>
    <span style="font-size: 18px">{{ post.excerpt }}</span>
{% endfor %}