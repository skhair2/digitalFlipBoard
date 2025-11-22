export const seoConfig = {
    defaultTitle: 'FlipDisplay.online - Virtual Split-Flap Display',
    titleTemplate: '%s | FlipDisplay.online',
    defaultDescription: 'Transform any screen into a stunning split-flap message board. Control from your phone, display on your TV. No hardware required. Free forever.',
    siteUrl: 'https://flipdisplay.online',
    defaultImage: 'https://flipdisplay.online/og-image.jpg',
    twitterHandle: '@flipdisplay',
    favicon: '/favicon.ico',

    // Structured data
    organization: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'FlipDisplay.online',
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
            title: 'FlipDisplay.online - Virtual Split-Flap Display for Any Screen',
            description: 'The best free alternative to physical split-flap displays. Turn your TV, monitor, or tablet into a retro message board. No hardware needed.',
            keywords: 'digital flipboard, virtual split flap, digitalflipboard, digital signage free, retro message board, split flap online, browser based display',
        },
        display: {
            title: 'Display Mode - Fullscreen Split-Flap Board',
            description: 'Launch your digital split-flap display in fullscreen. Pair with your phone to send messages instantly. Perfect for offices, cafes, and homes.',
            keywords: 'flipboard display mode, fullscreen message board, digital signage player, browser display',
        },
        control: {
            title: 'Remote Controller - Send Messages Instantly',
            description: 'Control your FlipDisplay.online from your phone. Type messages, choose colors, and trigger animations in real-time.',
            keywords: 'flipboard controller, remote message app, mobile control for display, split flap typer',
        },
        pricing: {
            title: 'Pricing - Free Forever & Pro Features',
            description: 'Start for free with unlimited messages. Upgrade to Pro for scheduled messages, custom themes, and API access.',
            keywords: 'digital flipboard pricing, free digital signage, digitalflipboard cost, split flap software price',
        },
        about: {
            title: 'About FlipDisplay.online - Our Mission & Story',
            description: 'Discover how FlipDisplay.online is bringing the nostalgic charm of split-flap displays to the digital age. Learn our mission and values.',
            keywords: 'about flipdisplay, digital flipboard company, split flap display history, about us',
        },
        contact: {
            title: 'Contact Us - Get Support for FlipDisplay.online',
            description: 'Get in touch with the FlipDisplay.online team. We\'re here to help with questions, support, and feedback.',
            keywords: 'contact flipdisplay, support, customer service, contact us',
        },
        blog: {
            title: 'Blog - Digital Signage & Split-Flap Tips',
            description: 'Read tutorials, guides, and tips about using FlipDisplay.online for digital signage and creative displays.',
            keywords: 'flipdisplay blog, digital signage tutorials, split flap tips, how to guides',
        },
        blogpost: {
            // Dynamic page - values passed via props
            title: 'Blog Post',
            description: 'Read the latest article from FlipDisplay.online',
            keywords: 'flipdisplay blog, digital signage',
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
