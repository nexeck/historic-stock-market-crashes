import { LTD } from "downsample";

const msToDays = 1 / 60 / 60 / 24 / 1000;

export const calculateTableData = (data, minDrawdown) => {
  const newTableData = [];
  let lastPeak = { price: 0 },
    lastTrough = { price: 0 };

  const checkDrawdown = (newPeak = {}) => {
    const percent = (1 - lastTrough.price / lastPeak.price) * 100;
    if (percent > minDrawdown) {
      const daysDown = (lastTrough.date - lastPeak.date) * msToDays;
      const daysDone = (newPeak.date - lastPeak.date) * msToDays;

      newTableData.push({
        startDate: lastPeak.date,
        endDate: lastTrough.date,
        startPrice: lastPeak.price,
        endPrice: lastTrough.price,
        daysDown: daysDown,
        percent: percent,
        daysDone: daysDone
      });
    }
  };

  for (const entry of data) {
    if (entry.price > lastPeak.price) {
      checkDrawdown(entry);
      lastPeak = entry;
      lastTrough = entry;
    } else if (entry.price < lastTrough.price) {
      lastTrough = entry;
    }
  }

  checkDrawdown();

  console.log("done with max drawdown calculation");

  return newTableData;
};

export const calculateChartData = (data, sampleRate) => {
  const newData = data.map(({ price, date }) => ({ x: date, y: price }));
  const numPointsInDownsampledData = sampleRate;
  const downsampledData = LTD(newData, numPointsInDownsampledData);

  console.log("done with data sampling");

  return [
    {
      id: "sampled",
      data: downsampledData
    }
  ];
};
