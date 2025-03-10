// Global variables for storing data
let senateLetterText = "";
let assemblyLetterText = "";
let senatorEmailAddress = "";
let assemblyEmailAddress = "";
const emailSubject = "Including Visual Effects in California Film Industry Tax Incentives";

// Direct event handling when document loads
document.addEventListener('DOMContentLoaded', function () {
    console.log('Page loaded, setting up handlers');

    // Generate button
    document.getElementById('generateBtn').addEventListener('click', function () {
        console.log('Generate button clicked');
        generateLetters();
    });

    // Copy letter buttons
    document.getElementById('copyBtn').addEventListener('click', function () {
        console.log('Copy Senate letter button clicked');
        const text = document.getElementById('letterContent').textContent;
        copyToClipboard(text, "Letter");
    });

    document.getElementById('copyAssemblyBtn').addEventListener('click', function () {
        console.log('Copy Assembly letter button clicked');
        const text = document.getElementById('assemblyLetterContent').textContent;
        copyToClipboard(text, "Letter");
    });

    // Copy email address buttons
    document.getElementById('copySenatorEmailBtn').addEventListener('click', function () {
        console.log('Copy Senator email button clicked');
        const emailText = document.getElementById('senatorEmail').textContent;
        copyToClipboard(emailText, "Email address");
    });

    document.getElementById('copyAssemblyEmailBtn').addEventListener('click', function () {
        console.log('Copy Assembly email button clicked');
        const emailText = document.getElementById('assemblyEmail').textContent;
        copyToClipboard(emailText, "Email address");
    });

    // Tab switching
    document.getElementById('senateTab').addEventListener('click', function () {
        setActiveTab('senate');
    });

    document.getElementById('assemblyTab').addEventListener('click', function () {
        setActiveTab('assembly');
    });
});

// Set active tab
function setActiveTab(tab) {
    if (tab === 'senate') {
        document.getElementById('senateTab').classList.add('active');
        document.getElementById('assemblyTab').classList.remove('active');
        document.getElementById('senateLetter').style.display = 'block';
        document.getElementById('assemblyLetter').style.display = 'none';
    } else {
        document.getElementById('senateTab').classList.remove('active');
        document.getElementById('assemblyTab').classList.add('active');
        document.getElementById('senateLetter').style.display = 'none';
        document.getElementById('assemblyLetter').style.display = 'block';
    }
}

// Function to get email from legislator name
function getEmailFromName(name, isSenateMember) {
    // Extract just the last name 
    let cleanName = name.replace(/^(Senator|Assemblymember|Assembly Member)\s+/i, '');
    cleanName = cleanName.replace(/\s+\(.*\)$/, ''); // Remove any district info

    // Get the last name - this assumes standard format of either "First Last" or "Last, First"
    let lastName;
    if (cleanName.includes(',')) {
        // Handle "Last, First" format
        lastName = cleanName.split(',')[0].trim();
    } else {
        // Handle "First Last" format
        const nameParts = cleanName.split(' ');
        lastName = nameParts[nameParts.length - 1].trim();
    }

    // Clean the last name - remove any non-alphabetic characters
    lastName = lastName.toLowerCase().replace(/[^a-z]/g, '');

    // Create email based on chamber
    if (isSenateMember) {
        return `senator.${lastName}@senate.ca.gov`;
    } else {
        return `assemblymember.${lastName}@assembly.ca.gov`;
    }
}

// Function to find legislators using Google Civic Information API
async function findLegislators(address, city, state, zip) {
    try {
        const fullAddress = `${address}, ${city}, ${state} ${zip}`;
        const apiKey = process.env.GOOGLE_API_KEY;
        const change = '';

        const url = `https://civicinfo.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(fullAddress)}&levels=administrativeArea1&key=${apiKey}`;

        console.log('Fetching legislator data from Google Civic API...');

        // Make the API request
        const response = await fetch(url);
        const data = await response.json();

        // Initialize legislator objects
        let senator = {
            name: "Your State Senator",
            email: "Please check senate.ca.gov for contact information",
            district: "California State Senate"
        };

        let assemblyMember = {
            name: "Your Assembly Member",
            email: "Please check assembly.ca.gov for contact information",
            district: "California State Assembly"
        };

        // Parse the response to find representatives
        if (data && data.offices && data.officials) {
            // Process each office to find state legislators
            data.offices.forEach(office => {
                // Check if this is a state legislative office
                if (office.levels && office.levels.includes('administrativeArea1') &&
                    office.officialIndices) {

                    // Determine if this is Senate or Assembly
                    const isUpperHouse = office.name.toLowerCase().includes('senate') ||
                        (office.roles && office.roles.includes && office.roles.includes('legislatorUpperBody'));

                    const isLowerHouse = office.name.toLowerCase().includes('assembly') ||
                        (office.roles && office.roles.includes && office.roles.includes('legislatorLowerBody'));

                    // Get the officials for this office
                    office.officialIndices.forEach(index => {
                        const official = data.officials[index];

                        if (official) {
                            // Create legislator object
                            const legislator = {
                                name: official.name,
                                district: office.name,
                                party: official.party || ""
                            };

                            // Generate email directly from name pattern
                            if (isUpperHouse) {
                                legislator.email = getEmailFromName(legislator.name, true);
                                // Add title if missing
                                if (!legislator.name.toLowerCase().includes('senator')) {
                                    legislator.name = "Senator " + legislator.name;
                                }
                                senator = legislator;
                            } else if (isLowerHouse) {
                                legislator.email = getEmailFromName(legislator.name, false);
                                // Add title if missing
                                if (!legislator.name.toLowerCase().includes('assembly')) {
                                    legislator.name = "Assemblymember " + legislator.name;
                                }
                                assemblyMember = legislator;
                            }
                        }
                    });
                }
            });
        } else {
            console.warn('Invalid or missing data from API:', data);

            // If the API response doesn't have the expected structure,
            // fall back to ZIP-based lookup
            return fallbackLegislatorLookup(zip);
        }

        return { senator, assemblyMember };

    } catch (error) {
        console.error('Error finding legislators:', error);
        alert('There was an error contacting the Google Civic API. Using fallback legislator information.');

        // Fallback to simple lookup if API fails
        return fallbackLegislatorLookup(zip);
    }
}

// Fallback function if API fails
function fallbackLegislatorLookup(zipCode) {
    // More comprehensive mapping of ZIP codes to legislators
    const senatorsByZip = {
        // Los Angeles Area
        "90001": { name: "Steven Bradford", district: "35th Senate District" },
        "90210": { name: "Ben Allen", district: "24th Senate District" },
        "90025": { name: "Ben Allen", district: "24th Senate District" },
        "90045": { name: "Lola Smallwood-Cuevas", district: "28th Senate District" },
        "91105": { name: "Anthony Portantino", district: "25th Senate District" },
        "91607": { name: "Caroline Menjivar", district: "20th Senate District" },

        // San Francisco Bay Area
        "94102": { name: "Scott Wiener", district: "11th Senate District" },
        "94103": { name: "Scott Wiener", district: "11th Senate District" },
        "94704": { name: "Nancy Skinner", district: "9th Senate District" },
        "94707": { name: "Nancy Skinner", district: "9th Senate District" },
        "94086": { name: "Josh Becker", district: "13th Senate District" },
        "94538": { name: "Aisha Wahab", district: "10th Senate District" },

        // San Diego Area
        "92101": { name: "Toni Atkins", district: "39th Senate District" },
        "92115": { name: "Toni Atkins", district: "39th Senate District" },
        "92126": { name: "Brian Jones", district: "40th Senate District" },

        // Sacramento Area
        "95814": { name: "Angelique Ashby", district: "8th Senate District" },
        "95825": { name: "Angelique Ashby", district: "8th Senate District" }
    };

    const assemblyByZip = {
        // Los Angeles Area
        "90001": { name: "Reggie Jones-Sawyer", district: "59th Assembly District" },
        "90210": { name: "Rick Chavez Zbur", district: "51st Assembly District" },
        "90025": { name: "Rick Chavez Zbur", district: "51st Assembly District" },
        "90045": { name: "Tina McKinnor", district: "61st Assembly District" },
        "91105": { name: "Chris Holden", district: "41st Assembly District" },
        "91607": { name: "Adrin Nazarian", district: "46th Assembly District" },

        // San Francisco Bay Area
        "94102": { name: "Matt Haney", district: "17th Assembly District" },
        "94103": { name: "Matt Haney", district: "17th Assembly District" },
        "94704": { name: "Buffy Wicks", district: "15th Assembly District" },
        "94707": { name: "Buffy Wicks", district: "15th Assembly District" },
        "94086": { name: "Marc Berman", district: "23rd Assembly District" },
        "94538": { name: "Alex Lee", district: "24th Assembly District" },

        // San Diego Area
        "92101": { name: "Chris Ward", district: "78th Assembly District" },
        "92115": { name: "Akilah Weber", district: "79th Assembly District" },
        "92126": { name: "Brian Maienschein", district: "76th Assembly District" },

        // Sacramento Area
        "95814": { name: "Kevin McCarty", district: "6th Assembly District" },
        "95825": { name: "Kevin McCarty", district: "6th Assembly District" }
    };

    // Get the senator information from our mapping, or use a default
    let senator = senatorsByZip[zipCode];
    if (senator) {
        // Add proper title if not already present
        if (!senator.name.toLowerCase().includes('senator')) {
            senator.name = "Senator " + senator.name;
        }
        // Generate email directly from pattern
        senator.email = getEmailFromName(senator.name, true);
    } else {
        senator = {
            name: "Your State Senator",
            email: "Please check senate.ca.gov for contact information",
            district: "California State Senate"
        };
    }

    // Get the assembly member information from our mapping, or use a default
    let assemblyMember = assemblyByZip[zipCode];
    if (assemblyMember) {
        // Add proper title if not already present
        if (!assemblyMember.name.toLowerCase().includes('assembly')) {
            assemblyMember.name = "Assemblymember " + assemblyMember.name;
        }
        // Generate email directly from pattern
        assemblyMember.email = getEmailFromName(assemblyMember.name, false);
    } else {
        assemblyMember = {
            name: "Your Assembly Member",
            email: "Please check assembly.ca.gov for contact information",
            district: "California State Assembly"
        };
    }

    return { senator, assemblyMember };
}

// Generate letters function
async function generateLetters() {
    console.log('Generating letters...');

    // Hide error messages
    document.querySelectorAll('.error').forEach(el => el.style.display = 'none');

    // Show loading indicator
    document.getElementById('loading').style.display = 'block';

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const zipCode = document.getElementById('zipCode').value.trim();
    const company = document.getElementById('company').value.trim();
    const occupation = document.getElementById('occupation')?.value.trim() || '';

    console.log('Form data collected:', { fullName, email, zipCode });

    // Basic validation
    let valid = true;

    if (!fullName) {
        document.getElementById('nameError').style.display = 'block';
        valid = false;
    }

    if (!email || !email.includes('@')) {
        document.getElementById('emailError').style.display = 'block';
        valid = false;
    }

    if (!address) {
        document.getElementById('addressError').style.display = 'block';
        valid = false;
    }

    if (!city) {
        document.getElementById('cityError').style.display = 'block';
        valid = false;
    }

    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
        document.getElementById('zipError').style.display = 'block';
        valid = false;
    }

    if (!valid) {
        document.getElementById('loading').style.display = 'none';
        return;
    }

    // Find legislators based on address
    const { senator, assemblyMember } = await findLegislators(address, city, 'CA', zipCode);

    // Store email addresses globally
    senatorEmailAddress = senator.email;
    assemblyEmailAddress = assemblyMember.email;

    console.log('Legislator emails:', { senatorEmailAddress, assemblyEmailAddress });

    // Current date
    const date = new Date();
    const formattedDate = `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`;

    // Create base letter text (common content)
    const baseLetterContent = `
I am writing to you regarding the upcoming legislation on tax incentives for the film industry in California. As one of the many visual effects professionals working in your district, I strongly urge you to expand these incentives to include the visual effects (VFX) sector.

California's film tax credit program has been instrumental in maintaining our state's competitive edge in film production. However, the current structure overlooks a critical component of modern filmmaking: visual effects. The VFX industry employs thousands of highly skilled Californians and contributes significantly to our state's economy and cultural output, yet California is the only major VFX hub without a standalone tax incentive. This puts California workers at a major disadvantage.

There are several compelling reasons to include visual effects in these tax incentives:

1. **Economic Impact**: The VFX industry creates high-paying technical jobs and supports numerous auxiliary businesses. By excluding VFX from tax incentives, California actively incentivizes productions to take this substantial portion of their work out of state.

2. **Global Competition**: Countries like Canada, the United Kingdom, and New Zealand offer generous incentives specifically targeting visual effects work. California-based VFX companies are losing projects to these regions, forcing many talented professionals to relocate or change careers.

3. **Technological Innovation**: California's VFX industry has been at the forefront of technological innovation in filmmaking. Supporting this sector reinforces our state's position as a leader in emerging technologies.

Currently, the qualification requirements are structured in ways that inherently exclude VFX work, despite its integral role in production. These barriers to access should be removed.

I would be happy to discuss this matter further with you or your staff, perhaps offering insights from my perspective within the industry. 

Thank you for your consideration of this important issue. Your support for including visual effects in film industry tax incentives would help preserve California's leadership in this vital creative and technical field.

Sincerely,

${fullName}
${address}
${city}, CA ${zipCode}
${email}`;

    // Add occupation and company if provided
    const signature = `${occupation ? '\n' + occupation : ''}${company ? '\n' + company : ''}`;

    // Format senator name with proper title if needed
    const senatorName = senator.name.toLowerCase().includes('senator') ? senator.name : "Senator " + senator.name;

    // Create Senate letter
    senateLetterText = `${formattedDate}

${senatorName}
${senator.district}

RE: Including Visual Effects in California Film Industry Tax Incentives

Dear ${senatorName},
${baseLetterContent}${signature}`;

    // Format assembly member name with proper title if needed
    const assemblyMemberName = assemblyMember.name.toLowerCase().includes('assembly') ?
        assemblyMember.name : "Assemblymember " + assemblyMember.name;

    // Create Assembly letter
    assemblyLetterText = `${formattedDate}

${assemblyMemberName}
${assemblyMember.district}

RE: Including Visual Effects in California Film Industry Tax Incentives

Dear ${assemblyMemberName},
${baseLetterContent}${signature}`;

    // Hide loading indicator
    document.getElementById('loading').style.display = 'none';

    // Update the Senate letter UI
    document.getElementById('letterContent').textContent = senateLetterText;
    document.getElementById('legislatorName').textContent = senatorName;
    document.getElementById('senatorEmail').textContent = senatorEmailAddress;

    // Update the Assembly letter UI
    document.getElementById('assemblyLetterContent').textContent = assemblyLetterText;
    document.getElementById('assemblyMemberName').textContent = assemblyMemberName;
    document.getElementById('assemblyEmail').textContent = assemblyEmailAddress;

    // Show the results area
    document.getElementById('resultArea').style.display = 'block';

    // Scroll to the result section
    document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });

    console.log('Letters generated successfully');
}

// Copy to clipboard helper
function copyToClipboard(text, contentType) {
    // Try the modern clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => alert(`${contentType} copied to clipboard!`))
            .catch(err => {
                console.error('Copy failed:', err);
                fallbackCopy(text, contentType);
            });
    } else {
        fallbackCopy(text, contentType);
    }
}

// Fallback copy method for older browsers
function fallbackCopy(text, contentType) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // Avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback copying ' + msg);
        alert(`${contentType} copied to clipboard!`);
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        alert(`Failed to copy. Please select and copy the ${contentType.toLowerCase()} manually.`);
    }

    document.body.removeChild(textArea);
}

// About overlay functionality
document.addEventListener('DOMContentLoaded', function () {
    // Set up about overlay handlers
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutOverlay = document.getElementById('aboutOverlay');
    const closeBtn = document.querySelector('.close-btn');

    if (aboutBtn && aboutOverlay && closeBtn) {
        aboutBtn.addEventListener('click', function () {
            aboutOverlay.style.display = 'block';
        });

        closeBtn.addEventListener('click', function () {
            aboutOverlay.style.display = 'none';
        });

        // Close when clicking outside the content
        aboutOverlay.addEventListener('click', function (event) {
            if (event.target === aboutOverlay) {
                aboutOverlay.style.display = 'none';
            }
        });
    }
});