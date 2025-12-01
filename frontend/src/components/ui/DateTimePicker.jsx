import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// Custom Input Component with modern styling
const CustomInput = forwardRef(({ value, onClick, placeholder, isDark, showTime }, ref) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onClick={onClick}
      onChange={() => {}}
      placeholder={placeholder}
      readOnly
      ref={ref}
      className={`w-full px-4 py-2.5 pl-11 rounded-lg border transition-all duration-200 cursor-pointer
        ${isDark 
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-blue-500 focus:border-blue-500' 
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 hover:border-blue-400 focus:border-blue-400'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
    />
    <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
      ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      {showTime ? <Clock className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
    </div>
  </div>
));

CustomInput.displayName = 'CustomInput';

const DateTimePicker = ({
  selected,
  onChange,
  showTimeSelect = false,
  dateFormat = showTimeSelect ? "MMM d, yyyy h:mm aa" : "MMM d, yyyy",
  placeholderText = showTimeSelect ? "Select date and time" : "Select date",
  minDate = null,
  maxDate = null,
  className = "",
  disabled = false,
  ...props
}) => {
  const { isDark } = useTheme();

  return (
    <div className={`date-time-picker ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        customInput={<CustomInput isDark={isDark} showTime={showTimeSelect} />}
        calendarClassName={isDark ? 'dark-calendar' : 'light-calendar'}
        popperClassName={isDark ? 'dark-popper' : 'light-popper'}
        timeCaption="Time"
        showPopperArrow={false}
        {...props}
      />
    </div>
  );
};

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;
