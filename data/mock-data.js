/**
 * Mock data for local development
 * This simulates the data structure returned from Airtable
 */

const mockBookingData = [
    {
        id: "rec1234567890",
        name: "Smith, John Michael",
        age: 32,
        city: "Lufkin",
        state: "TX",
        height: "5'10\"",
        weight: "175 lbs",
        bookingDate: new Date("2023-12-19T14:30:00"),
        releaseDate: null, // Still in custody
        mugshot: "https://via.placeholder.com/150x180/cccccc/666666?text=J.Smith",
        charges: [
            {
                description: "Driving While Intoxicated",
                bond: 2500.0
            },
            {
                description: "Failure to Maintain Financial Responsibility",
                bond: 500.0
            }
        ]
    },
    {
        id: "rec2345678901",
        name: "Doe, Jane Elizabeth",
        age: 28,
        city: "Huntington",
        state: "TX",
        height: "5'6\"",
        weight: "140 lbs",
        bookingDate: new Date("2023-12-19T08:15:00"),
        releaseDate: new Date("2023-12-19T16:45:00"),
        mugshot: "https://via.placeholder.com/150x180/dddddd/777777?text=J.Doe",
        charges: [
            {
                description: "Theft of Property",
                bond: 1000.0
            }
        ]
    },
    {
        id: "rec3456789012",
        name: "Johnson, Robert Lee",
        age: 45,
        city: "Nacogdoches",
        state: "TX",
        height: "6'2\"",
        weight: "220 lbs",
        bookingDate: new Date("2023-12-19T22:10:00"),
        releaseDate: null,
        mugshot: null, // No mugshot available
        charges: [
            {
                description: "Assault - Family Violence",
                bond: 5000.0
            },
            {
                description: "Public Intoxication",
                bond: 750.0
            }
        ]
    },
    {
        id: "rec4567890123",
        name: "Williams, Sarah Michelle",
        age: 24,
        city: "Diboll",
        state: "TX",
        height: "5'4\"",
        weight: "125 lbs",
        bookingDate: new Date("2023-12-19T11:20:00"),
        releaseDate: new Date("2023-12-19T19:30:00"),
        mugshot: "https://via.placeholder.com/150x180/eeeeee/888888?text=S.Williams",
        charges: [
            {
                description: "Possession of Controlled Substance",
                bond: 2000.0
            }
        ]
    },
    {
        id: "rec5678901234",
        name: "Brown, Michael David",
        age: 38,
        city: "Lufkin",
        state: "TX",
        height: "5'8\"",
        weight: "185 lbs",
        bookingDate: new Date("2023-12-19T03:45:00"),
        releaseDate: null,
        mugshot: "https://via.placeholder.com/150x180/cccccc/555555?text=M.Brown",
        charges: [
            {
                description: "Burglary of Habitation",
                bond: 15000.0
            },
            {
                description: "Criminal Trespass",
                bond: 1500.0
            },
            {
                description: "Evading Arrest or Detention",
                bond: 3000.0
            }
        ]
    }
];

const mockAdvertisementData = {
    id: "recAD12345678",
    title: "Local Business Advertisement",
    imageUrl: "https://via.placeholder.com/600x200/007acc/ffffff?text=Sample+Advertisement",
    linkUrl: "https://example-local-business.com",
    altText: "Visit our local business for great deals!",
    advertiser: "Sample Local Business"
};

// Alternative mock data sets for testing different scenarios
const mockScenarios = {
    // Empty day - no arrests
    noArrests: [],
    
    // Single arrest
    singleArrest: [mockBookingData[0]],
    
    // Many arrests (for pagination testing)
    manyArrests: [
        ...mockBookingData,
        ...mockBookingData.map((record, index) => ({
            ...record,
            id: `rec${6789012345 + index}`,
            name: record.name.replace(/^(\w+), (\w+)/, `$1${index + 6}, $2`),
            age: record.age + index,
            bookingDate: new Date(record.bookingDate.getTime() + (index * 3600000)) // +1 hour each
        }))
    ],
    
    // Mixed release status
    mixedReleases: mockBookingData,
    
    // No mugshots available
    noMugshots: mockBookingData.map(record => ({
        ...record,
        mugshot: null
    })),
    
    // All released
    allReleased: mockBookingData.map(record => ({
        ...record,
        releaseDate: new Date("2023-12-19T20:00:00")
    }))
};

module.exports = {
    mockBookingData,
    mockAdvertisementData,
    mockScenarios
};