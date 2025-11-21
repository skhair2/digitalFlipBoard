export const seoConfig = {
    defaultTitle: 'Digital Flipboard - Virtual Split-Flap Display',
    titleTemplate: '%s | Digital Flipboard',
    defaultDescription: 'Transform any screen into a stunning split-flap message board. Control from your phone, display on your TV. No hardware required. Free forever.',
    siteUrl: 'https://digitalflipboard.com',
    defaultImage: 'https://digitalflipboard.com/og-image.jpg',
    twitterHandle: '@digitalflipboard',
    favicon: '/favicon.ico',

    // Structured data
    organization: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Digital Flipboard',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '1247',
        },
    },

    // Page-specific SEO
    pages: {
        home: {
            title: 'Digital Flipboard - Virtual Split-Flap Display for Any Screen',
            description: 'The best free alternative to physical split-flap displays. Turn your TV, monitor, or tablet into a retro message board. No hardware needed.',
            keywords: 'digital flipboard, virtual split flap, vestaboard alternative, digital signage free, retro message board, split flap online, browser based display',
        },
        display: {
            title: 'Display Mode - Fullscreen Split-Flap Board',
            description: 'Launch your digital split-flap display in fullscreen. Pair with your phone to send messages instantly. Perfect for offices, cafes, and homes.',
            keywords: 'flipboard display mode, fullscreen message board, digital signage player, browser display',
        },
        control: {
            title: 'Remote Controller - Send Messages Instantly',
            description: 'Control your Digital Flipboard from your phone. Type messages, choose colors, and trigger animations in real-time.',
            keywords: 'flipboard controller, remote message app, mobile control for display, split flap typer',
        },
        pricing: {
            title: 'Pricing - Free Forever & Pro Features',
            description: 'Start for free with unlimited messages. Upgrade to Pro for scheduled messages, custom themes, and API access.',
            keywords: 'digital flipboard pricing, free digital signage, vestaboard cost, split flap software price',
        },
    },
}

// Generate meta tags for a page
export const getMetaTags = (page = 'home') => {
    const pageConfig = seoConfig.pages[page] || seoConfig.pages.home

    return {
        title: pageConfig.title,
        description: pageConfig.description,
        keywords: pageConfig.keywords,
        canonical: `${seoConfig.siteUrl}${page === 'home' ? '' : `/${page}`}`,
        openGraph: {
            type: 'website',
            url: `${seoConfig.siteUrl}${page === 'home' ? '' : `/${page}`}`,
            title: pageConfig.title,
            description: pageConfig.description,
            images: [
                {
                    url: seoConfig.defaultImage,
                    width: 1200,
                    height: 630,
                    alt: pageConfig.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            site: seoConfig.twitterHandle,
            title: pageConfig.title,
            description: pageConfig.description,
            image: seoConfig.defaultImage,
        },
    }
}
