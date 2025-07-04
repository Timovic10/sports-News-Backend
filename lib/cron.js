import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log("Sports news updated successfully.");
      } else {
        console.error(
          `Failed to update sports news. Status code: ${res.statusCode}`
        );
      }
    })
    .on("error", (err) => {
      console.error("Error fetching sports news:", err);
    });
});

export default job;
