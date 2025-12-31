#!/usr/bin/env python3
"""
Generate Economist-style chart: AI Adoption vs Maintenance Reduction
Fixed: 
- Title positioned below red bar (not overlapping)
- Inline labels positioned AWAY from lines (not overlapping)
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# Economist style settings
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['axes.linewidth'] = 0

# Data
years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
ai_adoption = [12, 18, 28, 42, 55, 68, 78, 81]
maintenance_reduction = [0, 2, 5, 8, 12, 14, 16, 18]

# Create figure
fig, ax = plt.subplots(figsize=(8, 5.5))

# Set background color
fig.patch.set_facecolor('#f1f0e9')
ax.set_facecolor('#f1f0e9')

# Plot lines
ax.plot(years, ai_adoption, color='#17648d', linewidth=2.5, marker='o', markersize=6)
ax.plot(years, maintenance_reduction, color='#843844', linewidth=2.5, marker='s', markersize=6)

# Data labels at end of lines
ax.annotate(f'{ai_adoption[-1]}%', xy=(years[-1], ai_adoption[-1]), xytext=(10, 0), 
            textcoords='offset points', fontsize=11, fontweight='bold', color='#17648d', va='center')
ax.annotate(f'{maintenance_reduction[-1]}%', xy=(years[-1], maintenance_reduction[-1]), xytext=(10, 0), 
            textcoords='offset points', fontsize=11, fontweight='bold', color='#843844', va='center')

# Horizontal gridlines only
ax.yaxis.grid(True, color='#cccccc', linewidth=0.5)
ax.xaxis.grid(False)

# Remove spines except bottom
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_color('#666666')
ax.spines['bottom'].set_linewidth(0.5)

# Y-axis
ax.set_ylim(0, 100)
ax.set_yticks([0, 20, 40, 60, 80, 100])
ax.set_yticklabels(['0', '20', '40', '60', '80', '100'], fontsize=10, color='#333333')
ax.tick_params(axis='y', length=0)

# X-axis
ax.set_xlim(2017.5, 2026)
ax.set_xticks(years)
ax.set_xticklabels([str(y) for y in years], fontsize=10, color='#333333')
ax.tick_params(axis='x', length=3, color='#666666')

# FIXED: Inline labels positioned ABOVE/BELOW lines, not on them
# For top line (AI adoption ~68 at 2023): place label ABOVE the line
ax.annotate('AI adoption\nin testing', 
            xy=(2023, 68),           # anchor point on the line
            xytext=(0, 15),          # offset UP from the line
            textcoords='offset points',
            fontsize=9, color='#17648d', 
            ha='center', va='bottom', linespacing=1.2)

# For bottom line (Maintenance ~14 at 2023): place label BELOW the line
ax.annotate('Maintenance\nburden reduction', 
            xy=(2023, 14),           # anchor point on the line
            xytext=(0, -25),         # offset DOWN from the line
            textcoords='offset points',
            fontsize=9, color='#843844', 
            ha='center', va='top', linespacing=1.2)

# Adjust layout FIRST
plt.tight_layout()
plt.subplots_adjust(top=0.78, bottom=0.12, left=0.10, right=0.88)

# THEN add red bar
rect = mpatches.Rectangle((0, 0.96), 1, 0.04, transform=fig.transFigure, 
                            facecolor='#e3120b', edgecolor='none', clip_on=False)
fig.patches.append(rect)

# THEN add title/subtitle (y=0.90, not 0.95!)
fig.text(0.10, 0.90, 'The automation gap', fontsize=16, fontweight='bold', color='#1a1a1a', 
         transform=fig.transFigure, ha='left')
fig.text(0.10, 0.85, 'AI adoption in testing vs. maintenance burden reduction, %', 
         fontsize=11, color='#666666', transform=fig.transFigure, ha='left')

# Source line
fig.text(0.10, 0.03, 'Sources: Tricentis Research; TestGuild Automation Survey 2018-2025', 
         fontsize=8, color='#888888', transform=fig.transFigure, ha='left')

# Save
plt.savefig('/home/claude/blog-automation/assets/charts/testing-times-ai-gap.png', 
            dpi=300, facecolor='#f1f0e9', edgecolor='none')
plt.close()

print("Chart saved successfully")
