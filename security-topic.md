---
layout: default
title: Security
permalink: /security/
description: Reporting and analysis on security debt, enterprise defence, and the operational trade-offs that shape resilient systems.
---

<div class="topic-page">
  <header class="topic-header">
    <h1 class="topic-title">Security</h1>
    <p class="topic-description">Reporting and analysis on security debt, enterprise defence, and the operational trade-offs that shape resilient systems</p>
  </header>

  {% assign security_posts = site.posts | where_exp: "post", "post.categories contains 'Security'" %}

  {% if security_posts.size > 0 %}
  <div class="topic-grid">
    {% for post in security_posts %}
      {% include post-card.html post=post %}
    {% endfor %}
  </div>
  {% else %}
  <p class="topic-empty">No articles yet. Check back soon or explore the <a href="/blog/">full archive</a>.</p>
  {% endif %}
</div>
