# Western University Earth Sciences Display Specimens - Prototype

> **Live Site:** https://kayaba-attribution.github.io/western-specimens/

**This is a pitch prototype** demonstrating a potential search and cluster interface for the Western University geocollections. It is intended for review by **Alysha McNeil** (geocollections) and **Roberta Flemming**.

## What This Prototype Shows

A searchable, filterable web interface for exploring display specimens from the Dana and Suffel collections in the Biological and Geological Sciences building at Western University.

### Features

- **Search** by specimen name, locality, or catalogue number
- **Filter** by collection (Dana, Suffel, Paleontology)
- **Group** specimens by:
  - Display category (Fluorescent Minerals, Critical Minerals, etc.)
  - Collection
  - Mineral family (machine-suggested)
- **Grid and List views**
- **Detailed modal** with full specimen information
- Responsive design for desktop and mobile

## Data Sources

All specimen data is extracted exclusively from these public display pages:

- [Display Information Index](https://www.uwo.ca/earth/geocollections/resources/displays/index.html)
- [Ammonoids Display](https://www.uwo.ca/earth/geocollections/resources/displays/ammonoids.html)
- [Fluorescent Minerals](https://www.uwo.ca/earth/geocollections/resources/displays/fluorescent_minerals.html)
- [Critical Minerals](https://www.uwo.ca/earth/geocollections/resources/displays/critical_minerals.html)
- [New Donations](https://www.uwo.ca/earth/geocollections/resources/displays/new_donations.html)
- [Historic Geophysical Equipment](https://www.uwo.ca/earth/geocollections/resources/displays/geophysical_equipment.html)

### Important Disclaimers

1. **This is NOT the full collection.** Western University's Richard W. Hutchinson Geoscience Collaborative Suite contains over 50,000 specimens. This prototype only includes ~45 items from public display pages.

2. **Machine-suggested classifications are marked with ⚠️.** The "Mineral Family" groupings are algorithmically suggested based on mineral properties and should not be treated as confirmed taxonomy.

3. **Images are hotlinked** from the official UWO website. For a production version, images should be properly hosted.

4. **No facts were invented.** All specimen information (names, catalogue numbers, localities, descriptions) comes directly from the source pages.

## How to Open

### Option 1: Live Site (GitHub Pages)

**https://kayaba-attribution.github.io/western-specimens/**

The site is deployed automatically via GitHub Actions when changes are pushed to `main`.

### Option 2: Local File

Simply open `index.html` in any modern web browser:

```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

### Option 3: Local Server

For development or if you encounter CORS issues:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## Project Structure

```
├── index.html          # Main HTML page
├── styles.css          # Styling
├── app.js              # JavaScript application logic
├── data/
│   └── specimens.json  # Specimen data extracted from source pages
└── README.md           # This file
```

## Technical Notes

- Pure HTML/CSS/JavaScript - no build process required
- No external dependencies or frameworks
- Responsive design using CSS Grid and Flexbox
- Accessible with keyboard navigation and ARIA labels
- Images lazy-loaded for performance

## Potential Future Enhancements

If this prototype is approved:

1. Integration with full collection database
2. Advanced filtering (by chemical composition, age, etc.)
3. Map visualization of specimen localities
4. 3D model viewer for select specimens
5. Export/print functionality for educational use
6. Multi-language support

## Contact

Richard W. Hutchinson Geoscience Collaborative Suite  
North Campus Building, Room 120  
1151 Richmond Street N.  
London, Ontario, Canada, N6A 5B7  
Email: geocollections@uwo.ca

---

*Prototype created October 2026*
