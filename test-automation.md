---
layout: default
title: Test Automation
permalink: /test-automation/
description: Strategies, frameworks, and practices for building test automation that delivers lasting value.
---

<div class="topic-page">
  <header class="topic-header">
    <h1 class="topic-title">Test Automation</h1>
    <p class="topic-description">Strategies, frameworks, and practices for building test automation that delivers lasting value</p>
  </header>

  {% assign ta_posts = site.posts | where_exp: "post", "post.categories contains 'Quality Engineering' or post.categories contains 'Test Automation'" %}

  {% if ta_posts.size > 0 %}
  <div class="topic-grid">
    {% for post in ta_posts %}
      {% include post-card.html post=post %}
    {% endfor %}
  </div>
  {% else %}
  <p class="topic-empty">No articles yet. Check back soon or explore the <a href="/blog/">full archive</a>.</p>
  {% endif %}
</div>
