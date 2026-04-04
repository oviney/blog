---
layout: default
title: Quality Engineering Insights
---

<div class="topic-page">
  <header class="topic-header">
    <h1 class="topic-title">Quality Engineering Insights</h1>
    <p class="topic-description">Practical strategies for software quality, test automation, and engineering leadership from 20+ years in the field.</p>
  </header>

  <section class="home-intro">
    <h2>What You'll Find Here</h2>
    <p>I write about the intersection of quality engineering strategy and hands-on technical practice. Whether you're building a QE function from scratch, scaling test automation, or making the case for quality investment to executive leadership, you'll find actionable frameworks and real-world lessons here.</p>

    <h3>Focus Areas</h3>
    <ul class="focus-areas">
      <li><strong>Quality Engineering Strategy:</strong> Building test strategies that align with business outcomes, not just code coverage metrics.</li>
      <li><strong>Test Automation Architecture:</strong> Designing automation that scales with your product and team.</li>
      <li><strong>Performance Engineering:</strong> Systematic approaches to performance that go beyond load testing.</li>
      <li><strong>Engineering Leadership:</strong> Managing quality functions, building teams, and influencing technical direction.</li>
    </ul>
  </section>

  {% assign hero_post = site.posts | where: "featured", true | first %}
  {% unless hero_post %}
    {% assign hero_post = site.posts | first %}
  {% endunless %}

  <section class="hero-post">
    {% if hero_post.image %}
    <a href="{{ hero_post.url | relative_url }}" class="hero-post-image">
      <img src="{{ hero_post.image | relative_url }}" alt="{{ hero_post.title }}">
    </a>
    {% endif %}

    <div class="hero-post-content">
      {% if hero_post.categories %}
      <div class="hero-post-category">{{ hero_post.categories | first }}</div>
      {% endif %}

      <h2 class="hero-post-title">
        <a href="{{ hero_post.url | relative_url }}">{{ hero_post.title }}</a>
      </h2>

      {% if hero_post.subtitle %}
      <p class="hero-post-subtitle">{{ hero_post.subtitle }}</p>
      {% endif %}

      <p class="hero-post-excerpt">{{ hero_post.excerpt | strip_html | truncatewords: 40 }}</p>

      <div class="hero-post-meta">
        <time datetime="{{ hero_post.date | date_to_xmlschema }}">
          {{ hero_post.date | date: "%B %-d, %Y" }}
        </time>
        <span class="meta-separator">|</span>
        {% assign words = hero_post.content | number_of_words %}
        <span>{{ words | divided_by: 200 | plus: 1 }} min read</span>
      </div>

      <a href="{{ hero_post.url | relative_url }}" class="hero-post-cta">Read more &rarr;</a>
    </div>
  </section>

  {% include newsletter.html %}

  {% assign remaining_posts = site.posts | where_exp: "post", "post.url != hero_post.url" %}
  {% if remaining_posts.size > 0 %}
  <section class="home-recent">
    <h2 class="home-recent-heading">More from the Blog</h2>
    <div class="topic-grid">
      {% for post in remaining_posts limit: 3 %}
      <article class="topic-card">
        {% if post.image %}
        <a href="{{ post.url | relative_url }}" class="topic-card-image">
          <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
        </a>
        {% endif %}
        <div class="topic-card-content">
          {% if post.categories %}
          <div class="topic-category">{{ post.categories | first }}</div>
          {% endif %}
          <h3 class="topic-card-title">
            <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
          </h3>
          <p class="topic-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 20 }}</p>
          <div class="topic-card-meta">
            <span class="topic-meta-item">{{ post.date | date: "%B %-d, %Y" }}</span>
          </div>
        </div>
      </article>
      {% endfor %}
    </div>
    <p class="view-all"><a href="/blog/">View all posts &rarr;</a></p>
  </section>
  {% endif %}
</div>
