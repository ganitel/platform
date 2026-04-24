import { ServiceListItem, ServiceDetail } from "@shared/api";

export const MOCK_PROPERTIES: ServiceListItem[] = [
    {
        id: "1",
        title: "Résidence Life",
        description: "American styled duplex, with beautiful interior, open lighting for your events...",
        service_type: "accommodation",
        accommodation_type: "apartment",
        status: "active",
        provider_id: "h1",
        location: {
            city: "Yaoundé",
            country: "Cameroon",
            address: "Minboman",
            latitude: 3.848,
            longitude: 11.502
        },
        pricing: {
            base_price: 85,
            currency: "USD",
            price_per: "night"
        },
        capacity: {
            max_guests: 4,
            bedrooms: 2,
            bathrooms: 2
        },
        rating: {
            average: 5,
            count: 693
        },
        amenities: ["wifi", "kitchen", "parking"],
        images: ["https://api.builder.io/api/v1/image/assets/TEMP/18bad4d4ba393e5ffd092ea009c74c0c15d07394?width=312"],
        is_favorited: false
    },
    {
        id: "2",
        title: "Le Palais",
        description: "Luxurious studio in the heart of the city...",
        service_type: "accommodation",
        accommodation_type: "apartment",
        status: "active",
        provider_id: "h2",
        location: {
            city: "Yaoundé",
            country: "Cameroon",
            address: "Minboman",
            latitude: 3.848,
            longitude: 11.502
        },
        pricing: {
            base_price: 65,
            currency: "USD",
            price_per: "night"
        },
        capacity: {
            max_guests: 2,
            bedrooms: 1,
            bathrooms: 1
        },
        rating: {
            average: 4.8,
            count: 420
        },
        amenities: ["wifi", "ac"],
        images: ["https://api.builder.io/api/v1/image/assets/TEMP/7d2ded20e6dc6fe7838905f734a80ed7f9272835?width=312"],
        is_favorited: false
    },
    {
        id: "3",
        title: "La Cruche",
        description: "Authentic and peaceful apartment...",
        service_type: "accommodation",
        accommodation_type: "apartment",
        status: "active",
        provider_id: "h3",
        location: {
            city: "Yaoundé",
            country: "Cameroon",
            address: "Minboman",
            latitude: 3.848,
            longitude: 11.502
        },
        pricing: {
            base_price: 95,
            currency: "USD",
            price_per: "night"
        },
        capacity: {
            max_guests: 4,
            bedrooms: 2,
            bathrooms: 2
        },
        rating: {
            average: 4.9,
            count: 150
        },
        amenities: ["wifi", "pool"],
        images: ["https://api.builder.io/api/v1/image/assets/TEMP/c5c483a4cf8f27001d83a9d3913318fcad6d206e?width=312"],
        is_favorited: false
    },
    {
        id: "4",
        title: "Buea Heights",
        description: "Mountain view apartment in Buea...",
        service_type: "accommodation",
        accommodation_type: "apartment",
        status: "active",
        provider_id: "h4",
        location: {
            city: "Buea",
            country: "Cameroon",
            address: "Upper Farms",
            latitude: 4.15,
            longitude: 9.24
        },
        pricing: {
            base_price: 55,
            currency: "USD",
            price_per: "night"
        },
        capacity: {
            max_guests: 3,
            bedrooms: 2,
            bathrooms: 1
        },
        rating: {
            average: 4.5,
            count: 85
        },
        amenities: ["wifi", "security"],
        images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"],
        is_favorited: false
    }
];

export const getMockPropertyDetail = (id: string): ServiceDetail | undefined => {
    const base = MOCK_PROPERTIES.find(p => p.id === id);
    if (!base) return undefined;
    
    const imageUrls = [
        base.images?.[0] || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522770179533-24471fcdba45?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
    ];
    
    return {
        ...base,
        images: imageUrls,
        house_rules: ["No smoking", "No pets"],
        // Add any additional fields specific to ServiceDetail
    };
};
