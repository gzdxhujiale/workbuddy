---
name: product-manager-toolkit
description: Comprehensive toolkit for product managers including  PRD templates, discovery frameworks. Use for  user research synthesis, requirement documentation, and product strategy development.
---

# Product Manager Toolkit

Essential tools and frameworks for modern product management, from discovery to delivery.

## Quick Start

### For PRD Creation
1. Choose template from `references/prd_templates.md`
2. Fill in sections based on discovery work

## Core Workflows

### PRD Development Process

1. **Choose Template**
   - **Standard PRD**: Complex features (6-8 weeks)
   - **One-Page PRD**: Simple features (2-4 weeks)
   - **Feature Brief**: Exploration phase (1 week)
   - **Agile Epic**: Sprint-based delivery
2. **Structure Content**
   - Problem → Solution
   - Always include out-of-scope
   - Clear acceptance criteria
3. **Collaborate**
   - Engineering for feasibility
   - Design for experience
   - Support for operational impact

## Key Scripts

## Reference Documents

### prd_templates.md
Multiple PRD formats for different contexts:

1. **Standard PRD Template**
   - Comprehensive 11-section format
   - Best for major features
   - Includes technical specs







## Best Practices

### Writing Great PRDs
1. Start with the problem, not solution
4. Use visuals (wireframes, flows)
5. Keep technical details in appendix
6. Version control changes





## Common Pitfalls to Avoid

1. **Solution-First Thinking**: Jumping to features before understanding problems
2. **Analysis Paralysis**: Over-researching without shipping
3. **Feature Factory**: Shipping features without measuring impact
4. **Ignoring Technical Debt**: Not allocating time for platform health

## Integration Points

This toolkit integrates with:
- **Analytics**: Amplitude, Mixpanel, Google Analytics
- **Roadmapping**: ProductBoard, Aha!, Roadmunk
- **Design**: Figma, Sketch, Miro
- **Development**: Jira, Linear, GitHub
- **Research**: Dovetail, UserVoice, Pendo
- **Communication**: Slack, Notion, Confluence

## Quick Commands Cheat Sheet

```bash
# Create sample data
python scripts/rice_prioritizer.py sample

# JSON outputs for integration
python scripts/rice_prioritizer.py features.csv --output json
python scripts/customer_interview_analyzer.py interview.txt json
```


