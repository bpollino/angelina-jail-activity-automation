# Angelina County Jail Activity Article Generator

## Project Overview
Automated system that generates daily HTML articles from jail booking data for angelina411.com. Data is scraped hourly from county jail records and stored in Airtable, then processed into formatted news articles similar to salina311.com's jail activity posts.

## Architecture & Data Flow
1. **Data Source**: County jail records scraped hourly → Airtable database
2. **Data Processing**: Daily aggregation of arrest records from Airtable API
3. **Article Generation**: HTML template engine creates formatted articles
4. **Publishing**: Generated HTML posted to angelina411.com news site

### Key Data Structure (from Airtable)
- Arrestee personal info (name, age, city, state, height, weight)
- Booking details (date/time, release status)
- Charges and bond amounts
- Mugshot images (when available)

## Development Workflow
- **Airtable Integration**: Use Airtable API to fetch daily booking records
- **HTML Structure**: Create static HTML matching salina311.com layout and styling
- **Template System**: Build reusable HTML templates for consistent article formatting
- **Image Handling**: Process and optimize mugshot images for web
- **Content Management**: Generate SEO-friendly articles with proper metadata

## HTML Structure Requirements
Initial focus: Create HTML structure matching salina311.com format

### Article Layout Pattern:
```html
<article>
  <header>
    <h1>Angelina County Jail Activity - [Day of Week]</h1>
    <p>Booking activity data, details and images provided by courtesy of the Angelina County Sheriff's Department.</p>
  </header>
  
  <section class="jail-activity">
    <p class="disclaimer">All person(s) listed below are considered innocent until proven guilty in a court of law.</p>
    
    <!-- Repeat for each arrestee -->
    <div class="arrestee-record">
      <div class="mugshot">
        <a href="[mugshot_url]" data-lightbox="mugshots">
          <img src="[mugshot_url]" alt="Click for Lightbox" />
        </a>
      </div>
      <div class="details">
        <p><strong>Name:</strong> [Last],[First] [Middle]</p>
        <p><strong>Age:</strong> [age]</p>
        <p><strong>City:</strong> [city]</p>
        <p><strong>State:</strong> [state]</p>
        <p><strong>Height:</strong> [height]</p>
        <p><strong>Weight:</strong> [weight]</p>
        <p><strong>Booked:</strong> [booking_date] - [booking_time]</p>
        <p><strong>Released:</strong> [release_info]</p>
        <div class="charges">
          <p><strong>Charges:</strong></p>
          <ul>
            <li>[charge_description] (Bond: $[bond_amount])</li>
            <!-- Repeat for multiple charges -->
          </ul>
        </div>
      </div>
    </div>
  </section>
  
  <footer>
    <p>Published by [Author]</p>
    <div class="tags">
      <span>Jail</span> <span>Booking</span> <span>Community Activities</span>
    </div>
  </footer>
</article>
```

### CSS Styling Priorities:
- Clean, readable typography matching news site standards
- Proper spacing between arrestee records
- Responsive image handling for mugshots
- Lightbox functionality for image viewing
- Mobile-responsive layout

## Key Integration Points
- **Airtable API**: https://airtable.com/appBn4Xs7GdnheynS (jail booking records)
- **Target Site**: https://www.angelina411.com/ (Ghost.io CMS)
- **Reference Format**: https://salina311.com/saline-county-jail-activity-friday-324767/
- **Ghost Admin API**: For programmatic post publishing
- **Ghost Theme Integration**: Custom CSS and templates for jail activity posts

## Ghost.io Publishing Integration
**Primary Approach**: Use Ghost Admin API for automated publishing

### Ghost API Workflow:
1. **Daily Data Processing**: Fetch arrest records from Airtable
2. **HTML Generation**: Create Ghost-compatible HTML content
3. **API Publishing**: Use Ghost Admin API to create and publish posts
4. **Content Structure**: Posts tagged with "Jail", "Booking", "Community Activities"

### Ghost Theme Integration:
- **Theme CSS**: Add jail activity styles to Ghost theme
- **Custom Templates**: Optional Handlebars templates for jail posts
- **Responsive Design**: Ensure mobile compatibility within Ghost themes

## Development Priorities
1. **HTML Structure**: Create static HTML template matching salina311.com visual layout
2. **CSS Styling**: Implement responsive design with proper typography and spacing
3. **Ghost API Integration**: Set up automated publishing to Ghost.io CMS
4. **Data Mapping**: Map Airtable fields to Ghost-compatible HTML content
5. **Theme Integration**: Add jail activity CSS to Ghost theme
6. **Automated Processing**: Build daily pipeline from Airtable → Ghost
7. **Error Handling**: Graceful handling of missing data and API failures

## Notes for AI Agents
- **Initial Focus**: Create HTML structure matching salina311.com layout before data integration
- Handle missing data gracefully (e.g., no mugshot, incomplete address info)
- Ensure legal disclaimers are prominently displayed
- Maintain consistent formatting with salina311.com reference example
- Focus on clean, accessible HTML structure with semantic elements
- Consider mobile responsiveness and modern web standards
- Use placeholder data initially to build and test HTML template structure

---
*Last updated: September 19, 2025*