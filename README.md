# market-status-API
The goal of this project is to create a public API REST that retrieves market information for trading pairs. It gets data from bittrex and mantein a local order book.

With HTTP request or websocket you can ask for the tips of the order book, or calculate the actual price for a sell/buy based in the disponibility of the order book.

### End Points / WS Methods

- **/tips**: Get tips of order book.
- **/calculate-price**: Calculate the actual price for a sell/buy.

## Solution Architecture:
This projects tries to implement clean architecture from uncle Bob:
- Entity:
	- Order Book
- Use Cases:
	- Tips
	- Buy-Sell-Price
- Controllers and Presenters:
	- obm_processor
	- market_status
- UI and External Interfaces:
	- API end point
	- Bittrex_socket_listener
  
![image](https://user-images.githubusercontent.com/83707961/190162521-f7373eee-9168-47dc-b195-20d6db76cd16.png)
