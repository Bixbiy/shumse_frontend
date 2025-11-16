export const storeInSession = (key, value) => {
    try {
        const storedValue = typeof value === "object" ? JSON.stringify(value) : value;
        sessionStorage.setItem(key, storedValue);
      
    } catch (error) {
        console.error("Error storing in session:", error);
    }
};

  ;
  
  export const lookInSession = (key) => {
    const data = sessionStorage.getItem(key);
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };
  
  export const removeFromSession = (key) => {
    sessionStorage.removeItem(key);
  };
  
  export const logoutUser = () => {
    sessionStorage.clear();
  };
  