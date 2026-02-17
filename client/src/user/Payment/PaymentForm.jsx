import React,{useContext, useState} from "react";
import axios from "axios";
import { generateUniqueId } from "esewajs";
import { AdminContext } from "../../../context/AdminContext";
const PaymentForm=()=>{
    const [amount, setAmount] = useState("");

  const handlePayment = async (e) => {
      const {backendUrl} = useContext(AdminContext);
    
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + '/initiate-payment', //server payment route
        {
          amount,
          productId: generateUniqueId(),
        }
      );

      window.location.href = response.data.url;
    } catch (error) {
      console.error("Error initiating payment:", error);
    }
  };

    return(
        <div>
      <h1>eSewa Payment Integration</h1>

      <div className="form-container" onSubmit={handlePayment}>
        <form className="styled-form">
          <div className="form-group">
            <label htmlFor="Amount">Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Enter amount"
            />
          </div>

          <button type="submit" className="submit-button">
            Pay with eSewa
          </button>
        </form>
      </div>
    </div>

    )
}

export default PaymentForm