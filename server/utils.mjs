export function destroyer(server) {
  var connections = {};

  server.on('connection', connection => {
    var key = connection.remoteAddress + ':' + connection.remotePort;
    connections[key] = connection;
    connection.on('close', () => {
      delete connections[key];
    });
  });

  server.destroy = callback => {
    server.close(callback);
    for (var key in connections) connections[key].destroy();
  };
}

function getAddress(location) {
  const {
    postalCode,
    administrativeArea: city,
    addressLines
  } = location.storefrontAddress;

  return `${postalCode}${city}${addressLines.join('')}`;
}

export function transformReportInsights(locationMetrics, locations) {
  return locationMetrics.map(locationMetric => {
    const location = locations.find(location =>
      locationMetric.locationName.includes(location.name)
    );
    const metricValues = locationMetric.metricValues.reduce(
      (result, { metric, totalValue }) => ({
        ...result,
        [metric]: Number(totalValue.value)
      }),
      {}
    );

    const metricValuesTotalByPrefixKey = ['ACTIONS', 'QUERIES', 'VIEWS'].reduce(
      (result, prefixKey) => {
        const total = Object.keys(metricValues)
          .filter(key => key.startsWith(prefixKey))
          .reduce((sum, key) => sum + metricValues[key], 0);

        return {
          ...result,
          [`${prefixKey}_TOTAL`]: total
        };
      },
      {}
    );

    return {
      name: location.name,
      title: location.title,
      address: getAddress(location),
      ...metricValues,
      ...metricValuesTotalByPrefixKey
    };
  });
}
