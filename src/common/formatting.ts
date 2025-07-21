export const formatEndpointList = (endpoints: Array<{ url: string }>): string => {
  if (endpoints.length === 0) {
    return 'No endpoints are being monitored in this channel.';
  }

  return `Currently monitoring ${endpoints.length} endpoint${endpoints.length === 1 ? '' : 's'}:\n\n${
    endpoints.map((ep, index) => `${index + 1}. ${ep.url}`).join('\n')
  }`;
};
