import { useState, useEffect} from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  alpha,
  Tooltip,
  CircularProgress,
  TextField,
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CalendarToday as CalendarIcon, 
  Block as BlockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import axios from 'axios';

// TIME SLOTS GENERATOR (10:00 AM to 11:00 PM, 30-min intervals)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour <= 23; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${String(displayHour).padStart(2, '0')}:${String(min).padStart(2, '0')} ${period}`;
      slots.push(timeStr);
    }
  }
  return slots;
};

// DATE BUTTONS COMPONENT
const DateButtons = ({ selectedDate, onDateChange, isDateFromCalendar, onOpenCalendar }) => {
  const today = dayjs();
  const dates = [];

  for (let i = 1; i <= 4; i++) {
    dates.push(today.add(i, 'day'));
  }

  if (isDateFromCalendar) {
    return (
      <Box sx={{ display: 'flex', gap: 1, pb: 1 }}>
        <Button
          onClick={() => onOpenCalendar()}
          sx={{
            px: 3,
            py: 2,
            borderRadius: 2,
            border: 'none',
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 14,
            textTransform: 'none',
            transition: 'all .15s ease',
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.02)',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ fontSize: 12, fontWeight: 400, mb: 0.5 }}>
              {selectedDate.format('ddd')}
            </Box>
            <Box sx={{ fontSize: 16, fontWeight: 700 }}>
              {selectedDate.format('DD MMM YYYY')}
            </Box>
          </Box>
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
      {dates.map((date) => (
        <Button
          key={date.format('YYYY-MM-DD')}
          onClick={() => onDateChange(date)}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: 2,
            minWidth: 100,
            border: '2px solid #E5E7EB',
            bgcolor: selectedDate?.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
              ? '#fff'
              : '#F9FAFB',
            borderColor: selectedDate?.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
              ? '#D4A574'
              : '#E5E7EB',
            color: '#1F2937',
            fontFamily: 'Inter',
            fontWeight: selectedDate?.format('YYYY-MM-DD') === date.format('YYYY-MM-DD') ? 700 : 600,
            fontSize: 14,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            transition: 'all .15s ease',
            boxShadow: selectedDate?.format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
              ? '0 4px 12px rgba(212, 165, 116, 0.15)'
              : 'none',
            '&:hover': {
              borderColor: '#D4A574',
              bgcolor: '#fff',
            },
          }}
        >
          <Box sx={{ textAlign: 'left' }}>
            <Box sx={{ fontSize: 12, fontWeight: 400, color: '#6B7280' }}>
              {date.format('ddd')}
            </Box>
            <Box sx={{ fontSize: 14, fontWeight: 600 }}>
              {date.format('DD MMM')}
            </Box>
          </Box>
        </Button>
      ))}
    </Box>
  );
};

// CALENDAR DIALOG
const CalendarDialog = ({ open, onClose, selectedDate, onDateSelect }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '24px 24px 0 0', sm: '16px' },
          position: { xs: 'fixed', sm: 'relative' },
          bottom: { xs: 0, sm: 'auto' },
          animation: { xs: 'slideUp 0.3s ease-out', sm: 'fadeIn 0.3s ease-out' },
          '@keyframes slideUp': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'scale(0.9)' },
            to: { opacity: 1, transform: 'scale(1)' },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 700 }}>
            When should we meet?
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={selectedDate}
            onChange={(newDate) => {
              onDateSelect(newDate);
              onClose();
            }}
            minDate={dayjs().add(1, 'day')}
            sx={{
              width: '100%',
              '& .MuiPickersDay-root': {
                fontFamily: 'Inter',
              },
              '& .MuiPickersDay-root.Mui-selected': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          />
        </LocalizationProvider>
      </DialogContent>
    </Dialog>
  );
};

// CUSTOMER DETAILS DIALOG
const CustomerDetailsDialog = ({ open, onClose, selectedDate, selectedTime, onSubmit, submitting }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '24px 24px 0 0', sm: '16px' },
          position: { xs: 'fixed', sm: 'relative' },
          bottom: { xs: 0, sm: 'auto' },
          animation: { xs: 'slideUp 0.3s ease-out', sm: 'fadeIn 0.3s ease-out' },
          '@keyframes slideUp': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'scale(0.9)' },
            to: { opacity: 1, transform: 'scale(1)' },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography sx={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 700 }}>
            Complete Your Booking
          </Typography>
          <IconButton size="small" onClick={onClose} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={3}>
          {/* Selected Slot Display */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
              border: '1px solid #D4A574',
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 400, color: '#6B7280', mb: 0.5 }}>
              Your Selected Slot
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {selectedDate.format('ddd, DD MMM YYYY')} at {selectedTime}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 13, color: '#6B7280', fontFamily: 'Inter' }}>
            <strong>Required</strong> to share booking details
          </Typography>

          {/* Name Field */}
          <TextField
            fullWidth
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: '#9CA3AF' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Inter',
                borderRadius: 2,
              },
            }}
          />

          {/* Mobile Field */}
          <TextField
            fullWidth
            label="Mobile Number"
            placeholder="Enter your mobile number"
            value={formData.mobile}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 10) {
                setFormData({ ...formData, mobile: value });
              }
            }}
            error={!!errors.mobile}
            helperText={errors.mobile}
            InputProps={{
              startAdornment: <PhoneIcon sx={{ mr: 1, color: '#9CA3AF' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Inter',
                borderRadius: 2,
              },
            }}
          />

          {/* Email Field */}
          <TextField
            fullWidth
            label="Email Address"
            placeholder="Enter your email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: '#9CA3AF' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Inter',
                borderRadius: 2,
              },
            }}
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            fullWidth
            sx={{
              py: 1.75,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontFamily: 'Inter',
              fontWeight: 600,
              fontSize: 15,
              textTransform: 'none',
              transition: 'all .2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              },
              '&:disabled': {
                background: '#9CA3AF',
                color: '#fff',
              },
            }}
          >
            {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Confirm Booking'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

// TIME SLOTS COMPONENT
const TimeSlots = ({ selectedTime, onTimeSelect, bookedSlots, loading }) => {
  const slots = generateTimeSlots();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        sx={{
          fontFamily: 'Inter',
          fontSize: 16,
          fontWeight: 700,
          mb: 2,
          color: '#1F2937',
        }}
      >
        Select time of day
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          maxHeight: 400,
          overflowY: 'auto',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F3F4F6',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: '10px',
            '&:hover': {
              background: '#9CA3AF',
            },
          },
        }}
      >
        {slots.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isSelected = selectedTime === slot;

          return (
            <Tooltip
              key={slot}
              title={isBooked ? 'This slot is already booked' : ''}
              arrow
              placement="top"
            >
              <span>
                <Button
                  onClick={() => !isBooked && onTimeSelect(slot)}
                  disabled={isBooked}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: isSelected
                      ? 'none'
                      : isBooked
                      ? '1px solid #DD0303'
                      : '1px solid #E5E7EB',
                    background: isSelected
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : isBooked
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #FFFFFF 50%)'
                      : '#F9FAFB',
                    color: isSelected ? '#fff' : isBooked ? '#CBCBCB' : '#1F2937',
                    fontFamily: 'Inter',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: 13,
                    textTransform: 'none',
                    transition: 'all .15s ease',
                    boxShadow: isSelected
                      ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                      : 'none',
                    opacity: isBooked ? 0.6 : 1,
                    cursor: isBooked ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    '&:hover': {
                      borderColor: isSelected
                        ? 'transparent'
                        : isBooked
                        ? '#FCA5A5'
                        : '#D4A574',
                      bgcolor: isSelected
                        ? undefined
                        : isBooked
                        ? undefined
                        : '#fff',
                      transform: isBooked ? 'none' : 'scale(1.02)',
                    },
                    '&.Mui-disabled': {
                      color: '#DD0303',
                      opacity: 0.8,
                    },
                  }}
                >
                  {slot}
                </Button>
              </span>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

// MAIN BOOKING DIALOG
const BookingSessionDialog = ({ open, onClose, bookingData }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day'));
  const [selectedTime, setSelectedTime] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isDateFromCalendar, setIsDateFromCalendar] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = "/api/usersOn";

  // Manual fetch function - called when date is clicked
  const fetchBookedSlots = async (date) => {
    if (!bookingData?.user_id) return;

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/bookings/available-slots`, {
        params: {
          block_id: bookingData.block_id,
          date: date.format('YYYY-MM-DD'),
        }
      });

      if (response.data.success) {
        setBookedSlots(response.data.bookedSlots || []);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch slots for initial date when dialog opens
  useEffect(() => {
    if (open && bookingData?.block_id) {
      fetchBookedSlots(selectedDate);
    }
  }, [open]); // Only run when dialog opens

  const handleContinue = () => {
    if (!selectedTime) {
      alert('Please select a time slot');
      return;
    }
    setCustomerDialogOpen(true);
  };

  const handleBookingSubmit = async (customerData) => {
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${baseUrl}/bookings/create`,
        {
          block_id: bookingData.block_id,
          userId: bookingData.user_id,
          customer_name: customerData.name,
          customer_mobile: customerData.mobile,
          customer_email: customerData.email,
          selected_date: selectedDate.format('YYYY-MM-DD'),
          selected_timeSlot: selectedTime,
        }
      );

      if (response.data.success) {
        alert(`Booking Confirmed Successfully!\n\nName: ${customerData.name}\nDate: ${selectedDate.format('ddd, DD MMM YYYY')}\nTime: ${selectedTime}\n\nConfirmation email sent to ${customerData.email}`);
        setCustomerDialogOpen(false);
        onClose();
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg = error?.response?.data?.error || 'Failed to create booking. Please try again.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCalendarDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setIsDateFromCalendar(true);
    fetchBookedSlots(date); // Fetch slots when calendar date is selected
  };

  const handleQuickDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setIsDateFromCalendar(false);
    fetchBookedSlots(date); // Fetch slots when quick date is selected
  };

  const handleOpenCalendar = () => {
    setCalendarOpen(true);
  };

  const isMeetingType = bookingData.interactionType === 'voice'
    ? 'Voice Meeting'
    : 'Video Meeting';

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 3,
            pt: 5,
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Inter',
              fontSize: { xs: 24, sm: 28 },
              fontWeight: 700,
              mb: 1,
            }}
          >
            {bookingData.title || '1:1 Booking'}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  border: '2px solid #1F2937',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#1F2937',
                }}
              >
                {isMeetingType}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                <Typography sx={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500 }}>
                  {bookingData.duration || 30} mins meeting
                </Typography>
              </Box>
            </Box>

            {bookingData.description && (
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: '#4B5563',
                }}
              >
                {bookingData.description}
              </Typography>
            )}

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  sx={{
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#1F2937',
                  }}
                >
                  Book your session
                </Typography>
                <IconButton
                  onClick={() => handleOpenCalendar()}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    border: '2px solid #E5E7EB',
                    color: '#6B7280',
                    transition: 'all .15s ease',
                    '&:hover': {
                      borderColor: '#D4A574',
                      bgcolor: alpha('#D4A574', 0.08),
                    },
                  }}
                >
                  <CalendarIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              <DateButtons
                selectedDate={selectedDate}
                onDateChange={handleQuickDateSelect}
                isDateFromCalendar={isDateFromCalendar}
                onOpenCalendar={handleOpenCalendar}
              />
            </Box>

            <TimeSlots
              selectedTime={selectedTime}
              onTimeSelect={setSelectedTime}
              bookedSlots={bookedSlots}
              loading={loading}
            />

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: selectedTime
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)'
                  : '#F3F4F6',
                border: selectedTime ? '1px solid #D4A574' : 'none',
                fontFamily: 'Inter',
                fontSize: 14,
                color: '#6B7280',
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 400, mb: 0.5 }}>
                {selectedTime ? 'Selected Slot' : 'Next available'}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1F2937',
                  background: selectedTime
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  backgroundClip: selectedTime ? 'text' : 'unset',
                  WebkitBackgroundClip: selectedTime ? 'text' : 'unset',
                  WebkitTextFillColor: selectedTime ? 'transparent' : '#1F2937',
                }}
              >
                {selectedDate.format('ddd, DD MMM')} at {selectedTime || '10:00 AM'}
              </Typography>
            </Box>

            <Button
              onClick={handleContinue}
              fullWidth
              sx={{
                py: 1.75,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
                color: '#fff',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: 15,
                textTransform: 'none',
                transition: 'all .2s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                  boxShadow: '0 8px 20px rgba(31, 41, 55, 0.3)',
                },
              }}
            >
              Continue
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <CalendarDialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onDateSelect={handleCalendarDateSelect}
      />

      <CustomerDetailsDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSubmit={handleBookingSubmit}
        submitting={submitting}
      />
    </>
  );
};

export default BookingSessionDialog;
