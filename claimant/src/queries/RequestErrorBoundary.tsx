import { AxiosError } from "axios";
import React from "react";

type State = {
  hasError: boolean;
  errorStatus?: number;
  message?: string;
};

type Props = Record<string, unknown>;

const baseUrl = process.env.REACT_APP_BASE_URL || "";
const loginUrl = baseUrl + "/idp/?redirect_to=" + window.location.href;

export class RequestErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: AxiosError) {
    return {
      hasError: true,
      errorStatus: error.isAxiosError ? error.response?.status : undefined,
      message: error.message,
    };
  }

  componentDidUpdate() {
    if (this.state.errorStatus === 401) {
      window.location.href = loginUrl;
    }
  }

  render() {
    if (this.state.hasError) {
      return <p>{this.state.message || "Something went wrong"}</p>;
    }

    return this.props.children;
  }
}
