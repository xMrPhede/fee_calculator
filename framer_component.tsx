import { addPropertyControls, ControlType } from "framer"
import * as React from "react"

export default function PaymentSavingsCalculator(props) {
    // Payment provider options
    const [providers, setProviders] = React.useState({
        stripe: {
            name: "Stripe Connect",
            payInPercentage: 2.9,
            payInFlatFee: 0.3,
            payOutPercentage: 0.25,
            payOutFlatFee: 0.25,
        },
        mangopay: {
            name: "Mangopay",
            payInPercentage: 1.5,
            payInFlatFee: 0.25,
            payOutPercentage: 0.25,
            payOutFlatFee: 0.2,
        },
        custom: {
            name: "Custom Provider",
            payInPercentage: 2.0,
            payInFlatFee: 0.25,
            payOutPercentage: 1.0,
            payOutFlatFee: 0.2,
        },
    })

    // State management
    const [selectedProvider, setSelectedProvider] = React.useState("stripe")
    const [monthlyPayInVolume, setMonthlyPayInVolume] = React.useState(100000)
    const [monthlyPayInTransactions, setMonthlyPayInTransactions] =
        React.useState(1000)
    const [monthlyPayOutVolume, setMonthlyPayOutVolume] = React.useState(80000)
    const [monthlyPayOutTransactions, setMonthlyPayOutTransactions] =
        React.useState(200)

    // Custom provider fees state
    const [customPayInPercentage, setCustomPayInPercentage] =
        React.useState(2.0)
    const [customPayInFlatFee, setCustomPayInFlatFee] = React.useState(0.25)
    const [customPayOutPercentage, setCustomPayOutPercentage] =
        React.useState(1.0)
    const [customPayOutFlatFee, setCustomPayOutFlatFee] = React.useState(0.2)

    // Form state
    const [formData, setFormData] = React.useState({
        name: "",
        company: "",
        email: "",
    })

    // Submission state
    const [submissionStatus, setSubmissionStatus] = React.useState(null) // null, 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = React.useState("")

    // Update custom provider values when changed
    React.useEffect(() => {
        if (selectedProvider === "custom") {
            setProviders((prev) => ({
                ...prev,
                custom: {
                    ...prev.custom,
                    payInPercentage: customPayInPercentage,
                    payInFlatFee: customPayInFlatFee,
                    payOutPercentage: customPayOutPercentage,
                    payOutFlatFee: customPayOutFlatFee,
                },
            }))
        }
    }, [
        customPayInPercentage,
        customPayInFlatFee,
        customPayOutPercentage,
        customPayOutFlatFee,
    ])

    // Format currency
    const formatCurrency = (amount) => {
        return (
            "€" +
            amount.toLocaleString("en-GB", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            })
        )
    }

    // Calculate costs and savings
    const provider = providers[selectedProvider]

    // Calculate current costs
    const payInPercentage = provider.payInPercentage / 100
    const payInFlatFee = provider.payInFlatFee
    const payOutPercentage = provider.payOutPercentage / 100
    const payOutFlatFee = provider.payOutFlatFee

    const monthlyPayInCost =
        payInPercentage * monthlyPayInVolume +
        monthlyPayInTransactions * payInFlatFee
    const monthlyPayOutCost =
        payOutPercentage * monthlyPayOutVolume +
        payOutFlatFee * monthlyPayOutTransactions
    const monthlyOtherCosts = 350 // Fixed costs related to Accounts setup and Manual labor of checking transactions
    const totalCurrentCost =
        monthlyPayInCost + monthlyPayOutCost + monthlyOtherCosts

    // Calculate new costs (our service)
    const totalMonthlyVolume = monthlyPayInVolume + monthlyPayOutVolume
    let platformFee = 150

    if (monthlyPayInVolume >= 50000 && monthlyPayInVolume < 500000) {
        platformFee = 300
    } else if (monthlyPayInVolume >= 500000 && monthlyPayInVolume < 2000000) {
        platformFee = 500
    } else if (monthlyPayInVolume >= 2000000) {
        platformFee = 1000
    }

    // Our Fees
    const ourPayinPercentage = 1
    const ourPayeesCost = 1
    const ourExtraCost = 50 //Cost of manual import of csv into the platform (we're not considering API here to be conservative)

    const totalOurCost =
        platformFee +
        (ourPayinPercentage / 100) * monthlyPayInVolume +
        ourPayeesCost * monthlyPayOutTransactions +
        ourExtraCost
    const monthlySavings = totalCurrentCost - totalOurCost
    const monthlySavingsPercentage = (monthlySavings / totalCurrentCost) * 100

    // Form handling
    const handleFormChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    // Form submission
    const handleSubmit = (e) => {
        e.preventDefault()

        // Basic validation
        if (!formData.name || !formData.email) {
            setSubmissionStatus("error")
            setErrorMessage("Please provide your name and email address.")
            return
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setSubmissionStatus("error")
            setErrorMessage("Please provide a valid email address.")
            return
        }

        // Set loading state
        setSubmissionStatus("loading")

        // Submit to Google Apps Script
        submitFormToGoogleScript()
    }

    // Function to submit data to Google Apps Script
    const submitFormToGoogleScript = () => {
        // Google Apps Script deployed URL
        const scriptUrl =
            "https://script.google.com/macros/s/AKfycbxU3MmBLPkFcyU18FqUO0FQ0te9QbduUpQKZK0G-DrGYgSg9ez4A9KEPOuA750aW-ad8A/exec"

        // Prepare the data exactly as expected by the Google Apps Script
        const dataToSend = {
            name: formData.name,
            company: formData.company || "Not provided",
            email: formData.email,
            payinVolume: monthlyPayInVolume,
            payinTransactions: monthlyPayInTransactions,
            payoutVolume: monthlyPayOutVolume,
            payoutTransactions: monthlyPayOutTransactions,
            isOtherProvider: selectedProvider === "custom", // Boolean flag if custom provider is selected
            payinPercentageFee:
                selectedProvider === "custom" ? customPayInPercentage : null,
            payinFixedFee:
                selectedProvider === "custom" ? customPayInFlatFee : null,
            payoutPercentageFee:
                selectedProvider === "custom" ? customPayOutPercentage : null,
            payoutFixedFee:
                selectedProvider === "custom" ? customPayOutFlatFee : null,
        }

        // Send the data to Google Apps Script
        fetch(scriptUrl, {
            method: "POST",
            mode: "no-cors", // This is important for CORS issues with Google Apps Script
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataToSend),
        })
            .then(() => {
                // We can't actually check for success due to "no-cors" mode
                // So we just assume it worked if there's no error
                setSubmissionStatus("success")

                // Reset form
                setFormData({
                    name: "",
                    company: "",
                    email: "",
                })

                // Reset error message
                setErrorMessage("")

                // After 5 seconds, reset submission status
                setTimeout(() => {
                    setSubmissionStatus(null)
                }, 5000)
            })
            .catch((error) => {
                console.error("Error submitting form:", error)
                setSubmissionStatus("error")
                setErrorMessage(
                    "There was an error submitting your form. Please try again later."
                )
            })
    }

    // Notification styling function
    const notificationStyle = (type) => ({
        padding: "12px 16px",
        marginBottom: "16px",
        borderRadius: "6px",
        backgroundColor: type === "success" ? "#ECFDF5" : "#FEF2F2",
        borderLeft: `4px solid ${type === "success" ? "#10B981" : "#EF4444"}`,
        color: type === "success" ? "#065F46" : "#B91C1C",
    })

    // Handle input and slider changes
    const handleInputChange = (setter, min, max) => (e) => {
        let value = e.target.value.replace(/[^0-9]/g, "")
        value =
            value === "" ? min : Math.max(min, Math.min(max, parseInt(value)))
        setter(value)
    }

    const handleSliderChange = (setter) => (e) => {
        setter(parseInt(e.target.value))
    }

    // Common styles
    const containerStyle = {
        width: "100%",
        maxWidth: "1200px",
        fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#ffffff",
        color: "#333333",
        padding: "24px",
        borderRadius: "12px",
        boxShadow:
            "0 4px 6px rgba(38, 24, 245, 0.1), 0 1px 3px rgba(38, 24, 245, 0.08)",
    }

    const headerStyle = {
        marginBottom: "24px",
        textAlign: "center",
    }

    const titleStyle = {
        fontSize: "22px",
        fontWeight: "700",
        color: "#2618F5",
        margin: "0 0 8px 0",
    }

    const formGroupStyle = {
        marginBottom: "20px",
    }

    const labelStyle = {
        fontSize: "14px",
        fontWeight: "600",
        marginBottom: "8px",
        display: "block",
    }

    const sliderContainerStyle = {
        display: "flex",
        alignItems: "center",
        marginBottom: "12px",
    }

    const sliderStyle = {
        flex: "1",
        margin: "0 10px 0 0",
        minWidth: "120px", // Add this line to ensure minimum width
    }

    const inputStyle = {
        width: "120px",
        padding: "8px 12px",
        border: "1px solid #D1D5DB",
        borderRadius: "6px",
        fontSize: "14px",
    }

    const resultContainerStyle = {
        backgroundColor: "#ECEAFD", // Lighter version of the main color (10%)
        padding: "16px",
        borderRadius: "8px",
        marginTop: "16px",
        border: "1px solid #D9D6FB", // Lighter version (20%)
    }

    const savingsStyle = {
        fontSize: "24px",
        fontWeight: "700",
        color: "#2618F5", // Main color
        margin: "12px 0",
    }

    const customFeesContainerStyle = {
        backgroundColor: "#F5F5FF", // Very light blue
        padding: "16px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #D9D6FB", // Light version of main color
    }

    const customFeeRowStyle = {
        display: "flex",
        alignItems: "center",
        marginBottom: "12px",
    }

    const customFeeLabelStyle = {
        fontSize: "13px",
        width: "160px",
    }

    const customFeeInputStyle = {
        width: "80px",
        padding: "6px 8px",
        border: "1px solid #D1D5DB",
        borderRadius: "4px",
        fontSize: "14px",
        marginRight: "8px",
    }

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h1 style={titleStyle}>{props.title}</h1>
                <p
                    style={{
                        fontSize: "14px",
                        color: "#6B7280",
                        margin: "0",
                    }}
                >
                    Estimate how much you could save on payment processing fees
                </p>
            </header>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}
            >
                {/* Provider Selection */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Payment Provider</label>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                        }}
                    >
                        {Object.keys(providers).map((key) => (
                            <button
                                key={key}
                                onClick={() => setSelectedProvider(key)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "6px",
                                    border:
                                        key === selectedProvider
                                            ? "2px solid #2618F5"
                                            : "1px solid #D1D5DB",
                                    backgroundColor:
                                        key === selectedProvider
                                            ? "#ECEAFD"
                                            : "#FFFFFF",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight:
                                        key === selectedProvider
                                            ? "600"
                                            : "normal",
                                    color:
                                        key === selectedProvider
                                            ? "#2618F5"
                                            : "#4B5563",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {providers[key].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Fee Settings (conditionally shown) */}
                {selectedProvider === "custom" && (
                    <div style={customFeesContainerStyle}>
                        <h3
                            style={{
                                fontSize: "15px",
                                fontWeight: "600",
                                margin: "0 0 12px 0",
                                color: "#2618F5",
                            }}
                        >
                            Custom Provider Fees
                        </h3>

                        <div style={customFeeRowStyle}>
                            <label style={customFeeLabelStyle}>
                                Pay-in Percentage
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                style={customFeeInputStyle}
                                value={customPayInPercentage}
                                onChange={(e) =>
                                    setCustomPayInPercentage(
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <span>%</span>
                        </div>

                        <div style={customFeeRowStyle}>
                            <label style={customFeeLabelStyle}>
                                Pay-in Fixed Fee
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={customFeeInputStyle}
                                value={customPayInFlatFee}
                                onChange={(e) =>
                                    setCustomPayInFlatFee(
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <span>€</span>
                        </div>

                        <div style={customFeeRowStyle}>
                            <label style={customFeeLabelStyle}>
                                Pay-out Percentage
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                style={customFeeInputStyle}
                                value={customPayOutPercentage}
                                onChange={(e) =>
                                    setCustomPayOutPercentage(
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <span>%</span>
                        </div>

                        <div style={customFeeRowStyle}>
                            <label style={customFeeLabelStyle}>
                                Pay-out Fixed Fee
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                style={customFeeInputStyle}
                                value={customPayOutFlatFee}
                                onChange={(e) =>
                                    setCustomPayOutFlatFee(
                                        parseFloat(e.target.value)
                                    )
                                }
                            />
                            <span>€</span>
                        </div>
                    </div>
                )}

                {/* Two column layout for volume inputs */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: "20px",
                    }}
                >
                    <div style={{ flex: "1", minWidth: "280px" }}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>
                                Monthly Pay-in Volume
                            </label>
                            <div style={sliderContainerStyle}>
                                <input
                                    type="range"
                                    style={sliderStyle}
                                    min="1000"
                                    max="5000000"
                                    step="1000"
                                    value={monthlyPayInVolume}
                                    onChange={handleSliderChange(
                                        setMonthlyPayInVolume
                                    )}
                                />
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={formatCurrency(
                                        monthlyPayInVolume
                                    ).replace("€", "")}
                                    onChange={handleInputChange(
                                        setMonthlyPayInVolume,
                                        1000,
                                        5000000
                                    )}
                                />
                            </div>
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>
                                Monthly Pay-in Transactions
                            </label>
                            <div style={sliderContainerStyle}>
                                <input
                                    type="range"
                                    style={sliderStyle}
                                    min="10"
                                    max="10000"
                                    step="10"
                                    value={monthlyPayInTransactions}
                                    onChange={handleSliderChange(
                                        setMonthlyPayInTransactions
                                    )}
                                />
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={monthlyPayInTransactions}
                                    onChange={handleInputChange(
                                        setMonthlyPayInTransactions,
                                        10,
                                        10000
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: "1", minWidth: "280px" }}>
                        <div style={formGroupStyle}>
                            <label style={labelStyle}>
                                Monthly Pay-out Volume
                            </label>
                            <div style={sliderContainerStyle}>
                                <input
                                    type="range"
                                    style={sliderStyle}
                                    min="1000"
                                    max="5000000"
                                    step="1000"
                                    value={monthlyPayOutVolume}
                                    onChange={handleSliderChange(
                                        setMonthlyPayOutVolume
                                    )}
                                />
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={formatCurrency(
                                        monthlyPayOutVolume
                                    ).replace("€", "")}
                                    onChange={handleInputChange(
                                        setMonthlyPayOutVolume,
                                        1000,
                                        5000000
                                    )}
                                />
                            </div>
                        </div>

                        <div style={formGroupStyle}>
                            <label style={labelStyle}>
                                Monthly Pay-out Transactions
                            </label>
                            <div style={sliderContainerStyle}>
                                <input
                                    type="range"
                                    style={sliderStyle}
                                    min="10"
                                    max="1000"
                                    step="10"
                                    value={monthlyPayOutTransactions}
                                    onChange={handleSliderChange(
                                        setMonthlyPayOutTransactions
                                    )}
                                />
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={monthlyPayOutTransactions}
                                    onChange={handleInputChange(
                                        setMonthlyPayOutTransactions,
                                        10,
                                        10000
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div style={resultContainerStyle}>
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        margin: "0 0 8px 0",
                    }}
                >
                    Your Potential Savings
                </h3>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                    }}
                >
                    <div>
                        <p
                            style={{
                                fontSize: "14px",
                                margin: "0 0 4px 0",
                                color: "#4B5563",
                            }}
                        >
                            Current Monthly Cost:
                        </p>
                        <p
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                margin: "0",
                                color: "#4B5563",
                            }}
                        >
                            {formatCurrency(totalCurrentCost)}
                        </p>
                    </div>
                </div>

                <div
                    style={{
                        borderTop: "1px solid #2618F5",
                        paddingTop: "12px",
                    }}
                >
                    <p
                        style={{
                            fontSize: "14px",
                            margin: "0 0 4px 0",
                            color: "#2618F5",
                        }}
                    >
                        Monthly Savings:
                    </p>
                    <div style={savingsStyle}>
                        {formatCurrency(monthlySavings)} (
                        {monthlySavingsPercentage.toFixed(0)}%)
                    </div>
                    <p
                        style={{
                            fontSize: "16px",
                            margin: "0",
                            color: "#2618F5",
                            fontWeight: "600",
                        }}
                    >
                        Yearly Savings: {formatCurrency(monthlySavings * 12)}
                    </p>
                </div>
            </div>

            {/* Get in Touch Section */}
            <div
                style={{
                    marginTop: "24px",
                    borderTop: "1px solid #D9D6FB",
                    paddingTop: "20px",
                }}
            >
                <p
                    style={{
                        fontSize: "15px",
                        margin: "0 0 12px 0",
                        color: "#555555",
                    }}
                >
                    Want to learn more about payment fee savings? Get in touch
                    with us!
                </p>

                {/* Form submission status notification */}
                {submissionStatus === "success" && (
                    <div style={notificationStyle("success")}>
                        <p style={{ margin: 0 }}>
                            Thank you! Your information has been submitted
                            successfully.
                        </p>
                    </div>
                )}

                {submissionStatus === "error" && (
                    <div style={notificationStyle("error")}>
                        <p style={{ margin: 0 }}>{errorMessage}</p>
                    </div>
                )}

                {/* Input fields (name and company side by side, email and button side by side) */}
                <form onSubmit={handleSubmit}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                            marginBottom: "16px",
                        }}
                    >
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            placeholder="Your name"
                            style={{
                                flex: "1 1 calc(50% - 6px)",
                                padding: "10px 12px",
                                fontSize: "14px",
                                borderRadius: "6px",
                                border: "1px solid #D1D5DB",
                                outline: "none",
                                transition: "all 0.2s ease",
                            }}
                        />
                        <input
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleFormChange}
                            placeholder="Your company"
                            style={{
                                flex: "1 1 calc(50% - 6px)",
                                padding: "10px 12px",
                                fontSize: "14px",
                                borderRadius: "6px",
                                border: "1px solid #D1D5DB",
                                outline: "none",
                                transition: "all 0.2s ease",
                            }}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "12px",
                        }}
                    >
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            placeholder="Your email address"
                            style={{
                                flex: 1,
                                padding: "10px 12px",
                                fontSize: "14px",
                                borderRadius: "6px",
                                border: "1px solid #D1D5DB",
                                outline: "none",
                                transition: "all 0.2s ease",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={submissionStatus === "loading"}
                            style={{
                                backgroundColor:
                                    submissionStatus === "loading"
                                        ? "#A5B4FC"
                                        : "#2618F5",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                padding: "10px 16px",
                                fontSize: "14px",
                                fontWeight: "600",
                                cursor:
                                    submissionStatus === "loading"
                                        ? "not-allowed"
                                        : "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {submissionStatus === "loading"
                                ? "Sending..."
                                : "Let's Chat"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Set default properties
PaymentSavingsCalculator.defaultProps = {
    title: "Payment Fee Savings Calculator",
}

// Add property controls for Framer
addPropertyControls(PaymentSavingsCalculator, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Payment Fee Savings Calculator",
    },
})
