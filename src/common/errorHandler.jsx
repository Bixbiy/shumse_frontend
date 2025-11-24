import toast from 'react-hot-toast';

export const handleError = (error, defaultMessage = "Something went wrong") => {
    console.error(error);
    const message = error.response?.data?.error || defaultMessage;
    toast.error(message);
    return message;
};
