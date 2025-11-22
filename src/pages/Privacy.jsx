import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function Privacy() {
    return (
        <>
            <Helmet>
                <title>Privacy Policy | FlipDisplay.online - Split-Flap Display Privacy</title>
                <meta name="description" content="Learn how FlipDisplay.online collects, uses, and protects your personal information. GDPR & CCPA compliant privacy policy for our digital split-flap display service." />
            </Helmet>

            <div className="min-h-screen bg-slate-900 py-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-8 md:p-12 border border-slate-700">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
                        <p className="text-gray-400 mb-8">Last updated: November 21, 2025</p>

                        <div className="prose prose-invert prose-lg max-w-none space-y-8 text-gray-300">
                            <section>
                                <p className="text-lg leading-relaxed">
                                    At FlipDisplay.online, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our web application and services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.1 Information You Provide</h3>
                                <p>When you create an account or use our services, we collect:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Account Information:</strong> Email address, username, and password</li>
                                    <li><strong>Profile Data:</strong> Display preferences, board names, and customization settings</li>
                                    <li><strong>Content:</strong> Messages you create and schedule for display</li>
                                    <li><strong>Communication Data:</strong> Support requests and feedback you send us</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.2 Automatically Collected Information</h3>
                                <p>We automatically collect certain information when you use our service:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Usage Data:</strong> Pages visited, features used, session duration, and interaction patterns</li>
                                    <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                                    <li><strong>Log Data:</strong> IP address, access times, error logs</li>
                                    <li><strong>Analytics Data:</strong> Aggregated usage statistics via Mixpanel</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">1.3 Cookies and Tracking Technologies</h3>
                                <p>We use cookies and similar technologies to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Maintain your session and remember your preferences</li>
                                    <li>Analyze usage patterns and improve our service</li>
                                    <li>Provide personalized features and content</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
                                <p>We use the collected information for the following purposes:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Service Delivery:</strong> Provide, maintain, and improve our display board services</li>
                                    <li><strong>Account Management:</strong> Create and manage your account, authenticate users</li>
                                    <li><strong>Communication:</strong> Send service updates, security alerts, and support messages</li>
                                    <li><strong>Analytics:</strong> Understand usage patterns and optimize user experience</li>
                                    <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
                                    <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Information Sharing and Disclosure</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Third-Party Service Providers</h3>
                                <p>We share information with trusted service providers who assist us in operating our service:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Supabase:</strong> Database hosting and authentication services</li>
                                    <li><strong>Mixpanel:</strong> Analytics and usage tracking</li>
                                    <li><strong>Cloud Infrastructure:</strong> Hosting and content delivery services</li>
                                </ul>
                                <p className="mt-3">These providers are contractually obligated to protect your data and use it only for the purposes we specify.</p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Legal Requirements</h3>
                                <p>We may disclose your information if required by law or in response to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Valid legal processes (subpoenas, court orders)</li>
                                    <li>Government or regulatory requests</li>
                                    <li>Protection of our rights, property, or safety</li>
                                    <li>Emergency situations involving personal safety</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.3 Business Transfers</h3>
                                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Security</h2>
                                <p>We implement industry-standard security measures to protect your information:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Encryption:</strong> Data in transit is encrypted using TLS/SSL protocols</li>
                                    <li><strong>Access Controls:</strong> Strict authentication and authorization mechanisms</li>
                                    <li><strong>Secure Storage:</strong> Passwords are hashed using industry-standard algorithms</li>
                                    <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
                                    <li><strong>Monitoring:</strong> Continuous monitoring for suspicious activities</li>
                                </ul>
                                <p className="mt-3 text-yellow-400">
                                    However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Your Privacy Rights</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 General Rights</h3>
                                <p>You have the following rights regarding your personal information:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                    <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                                    <li><strong>Objection:</strong> Object to certain processing activities</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 GDPR Rights (EU Users)</h3>
                                <p>If you are in the European Economic Area, you have additional rights under GDPR:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Right to withdraw consent at any time</li>
                                    <li>Right to lodge a complaint with a supervisory authority</li>
                                    <li>Right to restriction of processing</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.3 CCPA Rights (California Users)</h3>
                                <p>California residents have the right to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Know what personal information is collected, used, and shared</li>
                                    <li>Delete personal information held by us</li>
                                    <li>Opt-out of the sale of personal information (we do not sell your data)</li>
                                    <li>Non-discrimination for exercising privacy rights</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Data Retention</h2>
                                <p>We retain your information for as long as necessary to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Provide our services and maintain your account</li>
                                    <li>Comply with legal obligations and resolve disputes</li>
                                    <li>Enforce our agreements and protect our rights</li>
                                </ul>
                                <p className="mt-3">
                                    When you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Children's Privacy</h2>
                                <p>
                                    Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately, and we will take steps to delete such information.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. International Data Transfers</h2>
                                <p>
                                    Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Posting the updated policy on our website</li>
                                    <li>Updating the "Last updated" date</li>
                                    <li>Sending you an email notification for significant changes</li>
                                </ul>
                                <p className="mt-3">
                                    Your continued use of our service after changes become effective constitutes acceptance of the updated policy.
                                    By using FlipDisplay.online, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
