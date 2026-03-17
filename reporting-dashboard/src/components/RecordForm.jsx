import React, { useState } from 'react';
import '../styles/RecordForm.css';

function RecordForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    organization_unit: '',
    office_in_charge: '',
    proposed_activity: '',
    venue: '',
    activity_date_from: new Date().toISOString().split('T')[0],
    activity_date_to: new Date().toISOString().split('T')[0],
    time_in: '',
    time_out: '',
    no_of_participants: '',
    environmental_fee: '', // NEW
  });

  // Function to format time with AM/PM
  const formatTimeDisplay = (time) => {
    if (!time) return '';

    const [hours, minutes] = time.split(':');
    let hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    if (hour > 12) {
      hour = hour - 12;
    } else if (hour === 0) {
      hour = 12;
    }

    return `${String(hour).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.organization_unit ||
      !formData.office_in_charge ||
      !formData.proposed_activity ||
      !formData.venue ||
      !formData.activity_date_from ||
      !formData.activity_date_to ||
      !formData.time_in ||
      !formData.time_out ||
      !formData.no_of_participants
    ) {
      alert('Please fill in all required fields');
      return;
    }

    if (isNaN(formData.no_of_participants) || Number(formData.no_of_participants) <= 0) {
      alert('Number of participants must be a positive number');
      return;
    }

    // Environmental fee validation (optional, but must be >= 0 if provided)
    if (formData.environmental_fee !== '') {
      const fee = Number(formData.environmental_fee);
      if (Number.isNaN(fee) || fee < 0) {
        alert('Environmental fee must be a number 0 or greater');
        return;
      }
    }

    // Ensure backend receives a number (or 0)
    const payload = {
      ...formData,
      environmental_fee:
        formData.environmental_fee === '' ? 0 : Number(formData.environmental_fee),
    };

    onSubmit(payload);

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      organization_unit: '',
      office_in_charge: '',
      proposed_activity: '',
      venue: '',
      activity_date_from: new Date().toISOString().split('T')[0],
      activity_date_to: new Date().toISOString().split('T')[0],
      time_in: '',
      time_out: '',
      no_of_participants: '',
      environmental_fee: '', // NEW
    });
  };

  return (
    <div className="record-form">
      <h2> Add Record</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Record Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Organization/Unit/Office *</label>
          <input
            type="text"
            name="organization_unit"
            placeholder="e.g., HR Department"
            value={formData.organization_unit}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Officer in Charge *</label>
          <input
            type="text"
            name="office_in_charge"
            placeholder="e.g., Ms. Jane Doe"
            value={formData.office_in_charge}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Proposed Activity *</label>
          <textarea
            name="proposed_activity"
            placeholder="Describe the activity"
            value={formData.proposed_activity}
            onChange={handleChange}
            rows="2"
            required
          />
        </div>

        <div className="form-group">
          <label>Venue *</label>
          <input
            type="text"
            name="venue"
            placeholder="e.g., Conference Room A"
            value={formData.venue}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Activity Date From *</label>
            <input
              type="date"
              name="activity_date_from"
              value={formData.activity_date_from}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Activity Date To *</label>
            <input
              type="date"
              name="activity_date_to"
              value={formData.activity_date_to}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Time In * (1-12 AM/PM)</label>
            <div className="time-input-group">
              <input
                type="time"
                name="time_in"
                value={formData.time_in}
                onChange={handleChange}
                required
              />
              <span className="time-display">
                {formData.time_in && formatTimeDisplay(formData.time_in)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Time Out * (1-12 AM/PM)</label>
            <div className="time-input-group">
              <input
                type="time"
                name="time_out"
                value={formData.time_out}
                onChange={handleChange}
                required
              />
              <span className="time-display">
                {formData.time_out && formatTimeDisplay(formData.time_out)}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>No. of Participants *</label>
          <input
            type="number"
            name="no_of_participants"
            placeholder="0"
            value={formData.no_of_participants}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label>Environmental Fee (₱)</label>
          <input
            type="number"
            name="environmental_fee"
            placeholder="0.00"
            value={formData.environmental_fee}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          💾 Save Record
        </button>
      </form>
    </div>
  );
}

export default RecordForm;