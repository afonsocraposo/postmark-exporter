# Postmark Exporter

**Postmark Exporter** is a Next.js application deployed on Vercel. This app is designed to help you export large datasets from Postmark as CSV files, overcoming the API's batch size limitations. It fetches data in chunks, compiles the results, and provides a complete, downloadable CSV file.


## Features

- **Seamless Integration**: Connects directly to Postmark's API to fetch data.
- **Batch Processing**: Retrieves data in batches and merges them into a single file.
- **Overcomes Limitations**: Handles Postmark's API restrictions to deliver full datasets.
- **User-Friendly**: Minimalistic interface for ease of use.


## Deployment

This app is deployed on Vercel, ensuring fast and reliable performance.

## How It Works

1. **Connect to Postmark**: Enter your Postmark server key.
2. **Select Data**: Specify the parameters for the export.
3. **Process Data**: The app fetches data in batches, ensuring no information is lost.
4. **Export CSV**: Download the compiled CSV file.

### Security

Unfortunately, Postmark doesn't allow to make requests from the cliend-side 😢 (this would be ideal).

Therefore, the server token is passed in the headers to the Next.js backend and then it's used to make the requests to the Postmark API. The server token is never saved nor logged.

![Screenshot from Postmark website explaining why the API call doesn't work from the client side](/docs/images/postmark-client.png)

Source: https://postmarkapp.com/support/article/1179-what-does-a-cors-error-mean

## License

This project is open-source and available under the [MIT License](LICENSE).

---

Feel free to suggest any additional details or adjustments! 🤓
