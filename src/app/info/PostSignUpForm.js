"use client";
import React, { useState } from 'react';

const PostSignUpForm = () => {
    const [formData, setFormData] = useState({
        socialSecurity: '',
        monthlyBenefit: '',
        married: '',
        filingStatus: '',
        birthDate: ''
    });

    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleDateChange = (e) => {
        const { value } = e.target;
        setFormData({
            ...formData,
            birthDate: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);

        const regex = /^(0[1-9]|1[0-2])\/(19[0-9]{2}|20[0-2][0-4])$/;

        if (
            formData.socialSecurity === '' ||
            (formData.socialSecurity === 'yes' && formData.monthlyBenefit === '') ||
            formData.married === '' ||
            (formData.married === 'yes' && formData.filingStatus === '') ||
            !formData.birthDate ||
            !regex.test(formData.birthDate)
        ) {
            setError('Please fill out all required fields correctly.');
        } else {
            setError('');
            console.log('Form submitted:', formData);
        }
    };

    const styles = {
        formContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
        },
        form: {
            maxWidth: '600px',
            width: '100%',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            fontFamily: 'Arial, sans-serif',
        },
        formGroup: {
            marginBottom: '20px',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
        },
        input: {
            display: 'block',
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
        },
        radioGroup: {
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
        },
        radioLabel: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
        },
        button: {
            display: 'block',
            width: '100%',
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
        },
        buttonHover: {
            backgroundColor: '#45a049',
        },
        error: {
            color: 'red',
            fontSize: '14px',
            marginTop: '5px',
        },
    };

    return (
        <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Have you already started collecting social security?
                    </label>
                    <div style={styles.radioGroup}>
                        <label style={styles.radioLabel}>
                            <input
                                type="radio"
                                name="socialSecurity"
                                value="yes"
                                checked={formData.socialSecurity === 'yes'}
                                onChange={handleChange}
                                style={styles.input}
                            /> Yes
                        </label>
                        <label style={styles.radioLabel}>
                            <input
                                type="radio"
                                name="socialSecurity"
                                value="no"
                                checked={formData.socialSecurity === 'no'}
                                onChange={handleChange}
                                style={styles.input}
                            /> No
                        </label>
                    </div>
                    {submitted && formData.socialSecurity === '' && <div style={styles.error}>This field is required.</div>}
                </div>
                {formData.socialSecurity === 'yes' && (
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            What is your monthly benefit?
                        </label>
                        <input
                            type="text"
                            name="monthlyBenefit"
                            value={formData.monthlyBenefit}
                            onChange={handleChange}
                            placeholder="Enter your monthly benefit"
                            style={styles.input}
                        />
                        {submitted && formData.monthlyBenefit === '' && <div style={styles.error}>This field is required.</div>}
                    </div>
                )}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        Are you married?
                    </label>
                    <div style={styles.radioGroup}>
                        <label style={styles.radioLabel}>
                            <input
                                type="radio"
                                name="married"
                                value="yes"
                                checked={formData.married === 'yes'}
                                onChange={handleChange}
                                style={styles.input}
                            /> Yes
                        </label>
                        <label style={styles.radioLabel}>
                            <input
                                type="radio"
                                name="married"
                                value="no"
                                checked={formData.married === 'no'}
                                onChange={handleChange}
                                style={styles.input}
                            /> No
                        </label>
                    </div>
                    {submitted && formData.married === '' && <div style={styles.error}>This field is required.</div>}
                </div>
                {formData.married === 'yes' && (
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Are you filing married doubly or singly?
                        </label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="filingStatus"
                                    value="doubly"
                                    checked={formData.filingStatus === 'doubly'}
                                    onChange={handleChange}
                                    style={styles.input}
                                /> Doubly
                            </label>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="filingStatus"
                                    value="singly"
                                    checked={formData.filingStatus === 'singly'}
                                    onChange={handleChange}
                                    style={styles.input}
                                /> Singly
                            </label>
                        </div>
                        {submitted && formData.filingStatus === '' && <div style={styles.error}>This field is required.</div>}
                    </div>
                )}
                <div style={styles.formGroup}>
                    <label style={styles.label}>
                        What month and year were you born?
                    </label>
                    <input
                        type="text"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleDateChange}
                        placeholder="mm/yyyy"
                        style={styles.input}
                    />
                    {submitted && !formData.birthDate && <div style={styles.error}>This field is required.</div>}
                    {submitted && formData.birthDate && !/^(0[1-9]|1[0-2])\/(19[0-9]{2}|20[0-2][0-4])$/.test(formData.birthDate) && (
                        <div style={styles.error}>Invalid date. Please enter a value between 01/1900 and 12/2024.</div>
                    )}
                </div>
                {submitted && error && <div style={styles.error}>{error}</div>}
                <button
                    type="submit"
                    style={styles.button}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

export default PostSignUpForm;
