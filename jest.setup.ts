import "@testing-library/jest-dom";

// Mock Canvas Confetti
jest.mock("canvas-confetti", () => jest.fn());

// Mock Stripe SDK
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => {
    return {
      accounts: {
        retrieve: jest.fn().mockResolvedValue({ id: "acct_test" }),
      },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: "pi_test_secret" }),
      },
    };
  });
});

// Mock Resend SDK
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: jest.fn().mockResolvedValue({ data: { id: "email_id" }, error: null }),
        },
      };
    }),
  };
});

// Mock Twilio SDK
jest.mock("twilio", () => {
  const mockTwilioClient = {
    messages: {
      create: jest.fn().mockResolvedValue({ sid: "sms_sid" }),
    },
  };
  const mockTwilio = jest.fn(() => mockTwilioClient);
  return mockTwilio;
});

// Mock Supabase Server and client
jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };
});

jest.mock("@/utils/supabase/admin", () => {
  return {
    supabaseAdmin: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

// Mock Framer Motion to prevent layout animations from triggering assertions failures
jest.mock("framer-motion", () => {
  const React = require("react");
  const Dummy = (props: any) => React.createElement("div", props, props.children);
  return {
    motion: {
      div: Dummy,
      span: Dummy,
      button: Dummy,
    },
    AnimatePresence: (props: any) => props.children,
  };
});
