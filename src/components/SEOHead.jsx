import { Helmet } from 'react-helmet-async'
import { getMetaTags, seoConfig } from '../config/seo'

export default function SEOHead({ page }) {
    const meta = getMetaTags(page)

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{meta.title}</title>
            <meta name="title" content={meta.title} />
            <meta name="description" content={meta.description} />
            <meta name="keywords" content={meta.keywords} />
            <link rel="canonical" href={meta.canonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={meta.openGraph.type} />
            <meta property="og:url" content={meta.openGraph.url} />
            <meta property="og:title" content={meta.openGraph.title} />
            <meta property="og:description" content={meta.openGraph.description} />
            <meta property="og:image" content={meta.openGraph.images[0].url} />
            <meta property="og:image:width" content={meta.openGraph.images[0].width} />
            <meta property="og:image:height" content={meta.openGraph.images[0].height} />

            {/* Twitter */}
            <meta property="twitter:card" content={meta.twitter.card} />
            <meta property="twitter:url" content={meta.openGraph.url} />
            <meta property="twitter:title" content={meta.twitter.title} />
            <meta property="twitter:description" content={meta.twitter.description} />
            <meta property="twitter:image" content={meta.twitter.image} />

            {/* Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(seoConfig.organization)}
            </script>
        </Helmet>
    )
}
