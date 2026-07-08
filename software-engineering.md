---
layout: default
title: Software Engineering
permalink: /software-engineering/
description: Systematic methods, architectural decisions, and engineering practices that distinguish sustainable software from ad-hoc coding.
---

<div class="topic-page">
  <header class="topic-header">
    <h1 class="topic-title">Software Engineering</h1>
    <p class="topic-description">Systematic methods, architectural decisions, and engineering practices that distinguish sustainable software from ad-hoc coding</p>
  </header>

  {% assign se_posts = site.posts | where_exp: "post", "post.categories contains 'Software Engineering'" %}

  {% if se_posts.size > 0 %}
  <div class="topic-grid">
    {% for post in se_posts %}
      {% include post-card.html post=post %}
    {% endfor %}
  </div>
  {% else %}
  <p class="topic-empty">No articles yet. Check back soon or explore the <a href="/blog/">full archive</a>.</p>
  {% endif %}
</div>
