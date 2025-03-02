// Set up the canvas and context
const width = 600;
const height = 400;
const canvas = document.getElementById("globeCanvas");
canvas.width = width;
canvas.height = height;
const context = canvas.getContext("2d");

// Reference to the country name display div
const countryNameDiv = document.getElementById("countryName");

// Country name mapping for consistent formatting
const countryNameMapping = {
  "USA": "United States of America",
  "UK": "United Kingdom",
  "Russia": "Russian Federation",
  "South Korea": "Korea, Republic of",
  "Venezuela": "Venezuela (Bolivarian Republic of)",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  "Iran": "Iran (Islamic Republic of)",
  "Vietnam": "Viet Nam",
  "UAE": "United Arab Emirates",
  "Australia": "Australia",
  "Qatar": "Qatar",
  "Sweden": "Sweden",
  "Azerbaijan": "Azerbaijan",
  "Spain": "Spain",
  "Germany": "Germany",
  "Switzerland": "Switzerland",
  "Belgium": "Belgium",
  "Hungary": "Hungary",
  "Argentina": "Argentina",
  "Morocco": "Morocco",
  "France": "France",
  "South Africa": "South Africa",
  "Portugal": "Portugal",
  "Turkey": "Turkey",
  "Saudi Arabia": "Saudi Arabia",
  "Malaysia": "Malaysia",
  "Singapore": "Singapore",
  "Mexico": "Mexico",
  "Monaco": "Monaco",
  "Canada": "Canada",
  "Italy": "Italy",
  "Japan": "Japan",
  "Brazil": "Brazil",
  "China": "China",
  "Austria": "Austria",
  "India": "India",
  "Netherlands": "Netherlands",
  "Korea": "Korea, Republic of",
  "Bahrain": "Bahrain",
  "Singapore": "Singapore",
  "Monaco": "Monaco",
  "USA": "United States of America"  // for Las Vegas

};

// Helper function to map country names
function getMappedCountryName(country) {
  return countryNameMapping[country] || country;
}

// Set up the globe projection and path generator
const projection = d3.geoOrthographic().fitExtent(
  [[10, 10], [width - 10, height - 10]],
  { type: "Sphere" }
);
const path = d3.geoPath(projection, context);

// Load world map and F1 circuits data
Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.csv("circuits_new.csv"),
]).then(([worldData, circuits]) => {
  const land = topojson.feature(worldData, worldData.objects.countries).features;
  const borders = topojson.mesh(
    worldData,
    worldData.objects.countries,
    (a, b) => a !== b
  );

  // Function to render the globe
  function render(highlightCountry, highlightLocation, circuitName, yearsActive, arcCoords = null) {
    context.clearRect(0, 0, width, height);

    // Draw the globe
    context.beginPath();
    path({ type: "Sphere" });
    context.fillStyle = "#1b1b1b"; // Globe background color
    context.fill();
    context.strokeStyle = "white"; // Globe border color
    context.lineWidth = 2;
    context.stroke();

    // Draw countries on the globe
    land.forEach((country) => {
      context.beginPath();
      path(country);

      const mappedCountryName = getMappedCountryName(highlightCountry);
      const countryNameInData = country.properties.name;

      if (countryNameInData === mappedCountryName) {
        context.fillStyle = "red"; // Highlighted country in red
      } else {
        context.fillStyle = "#444"; // Default color for other countries
      }
      context.fill();
    });

    // Draw country borders
    context.beginPath();
    path(borders);
    context.strokeStyle = "white";
    context.lineWidth = 0.5;
    context.stroke();

    // Draw the arc between previous and current circuit
    if (arcCoords) {
      context.beginPath();
      const arcPath = d3.geoPath().projection(projection).context(context);
      arcPath({ type: "LineString", coordinates: arcCoords });
      context.strokeStyle = "#bbb";
      context.lineWidth = 2;
      context.stroke();
    }

    // Draw marker for the circuit
    if (highlightLocation) {
      const [x, y] = projection([highlightLocation.lng, highlightLocation.lat]);
      context.beginPath();
      context.arc(x, y, 5, 0, 2 * Math.PI);
      context.fillStyle = "red";
      context.fill();

      // Add circuit name label
      context.font = "bold 14px Arial";
      context.fillStyle = "white";
      context.fillText(circuitName, x + 7, y);
    }
  }

  // Initial render of the globe
  render();

  // Rotate and highlight circuits one by one
  let previousLocation = null;
  circuits.forEach((circuit, i) => {
    const country = circuit.country;
    const location = { lat: +circuit.lat, lng: +circuit.lng };
    const circuitName = circuit.name;
    const yearsActive = circuit["Years Active"];

    setTimeout(() => {
      // Update the country name display
      countryNameDiv.innerText = `Country: ${country} | Circuit: ${circuitName} | Years Active: ${yearsActive}`;

      // Define the rotation interpolation
      const iv = d3.interpolate(
        projection.rotate(),
        [-location.lng, 20 - location.lat]
      );

      // Define arc coordinates for animation
      const arcCoords = previousLocation
        ? [[previousLocation.lng, previousLocation.lat], [location.lng, location.lat]]
        : null;

      // Animate rotation
      d3.transition()
        .duration(1250)
        .tween("rotate", () => (t) => {
          projection.rotate(iv(t));
          render(country, location, circuitName, yearsActive, arcCoords);
        });

      // Update previous location
      previousLocation = location;
    }, i * 2000); // Delay for each transition
  });
}).catch((error) => console.error("Error loading data:", error));
