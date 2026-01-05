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

  <section class="home-latest">
    <h2>Latest from the Blog</h2>
    {% assign latest_post = site.posts | first %}
    <article class="topic-card">
      {% if latest_post.image %}
      <a href="{{ latest_post.url | relative_url }}" class="topic-card-image">
        <img src="{{ latest_post.image | relative_url }}" alt="{{ latest_post.title }}">
      </a>
      {% else %}
      <a href="{{ latest_post.url | relative_url }}" class="topic-card-image topic-card-image-placeholder" aria-label="{{ latest_post.title }}">
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
        {% if latest_post.categories %}
        <div class="topic-category">{{ latest_post.categories | first }}</div>
        {% endif %}
        
        <h3 class="topic-card-title">
          <a href="{{ latest_post.url | relative_url }}">{{ latest_post.title }}</a>
        </h3>
        
        <p class="topic-card-excerpt">{{ latest_post.excerpt | strip_html | truncatewords: 20 }}</p>
        
        <div class="topic-card-meta">
          <span class="topic-meta-item">{{ latest_post.date | date: "%B %d, %Y" }}</span>
          {% assign words = latest_post.content | number_of_words %}
          <span class="topic-meta-item">{{ words | divided_by: 200 | plus: 1 }} min read</span>
        </div>
      </div>
    </article>
    
    <p class="view-all"><a href="/blog/">View all posts &rarr;</a></p>
  </section>
</div>
