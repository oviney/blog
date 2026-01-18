---
layout: default
title: Test Automation
permalink: /test-automation/
---

<div class="topic-page">
  <header class="topic-header">
    <h1 class="topic-title">Test Automation</h1>
    <p class="topic-description">Strategies, frameworks, and practices for building test automation that delivers lasting value</p>
  </header>

  {% assign ta_posts = site.posts | where_exp: "post", "post.categories contains 'quality-engineering' or post.categories contains 'test-automation' or post.categories contains 'test-strategy'" %}

  {% if ta_posts.size > 0 %}
  <div class="topic-grid">
    {% for post in ta_posts %}
      <article class="topic-card">
        {% if post.image %}
        <a href="{{ post.url | relative_url }}" class="topic-card-image">
          <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
        </a>
        {% else %}
        <a href="{{ post.url | relative_url }}" class="topic-card-image topic-card-image-placeholder" aria-label="{{ post.title }}">
          <div class="placeholder-content" aria-hidden="true">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </div>
        </a>
        {% endif %}

        <div class="topic-card-content">
          {% if post.categories %}
          <div class="topic-category">{{ post.categories | first }}</div>
          {% endif %}

          <h2 class="topic-card-title">
            <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          </h2>

          <p class="topic-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>

          <div class="topic-card-meta">
            {% assign words = post.content | number_of_words %}
            <span class="topic-meta-item">{{ words | divided_by: 200 | plus: 1 }} min read</span>
          </div>
        </div>
      </article>
    {% endfor %}
  </div>
  {% else %}
  <p class="topic-empty">No articles yet. Check back soon or explore the <a href="/blog/">full archive</a>.</p>
  {% endif %}
</div>
