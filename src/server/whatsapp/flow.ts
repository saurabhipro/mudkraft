/**
 * The checkout form customers fill inside WhatsApp (a WhatsApp Flow) after sending
 * their cart. `npm run whatsapp:flow` uploads this to Meta and publishes it; the
 * printed id goes into WHATSAPP_FLOW_ID.
 *
 * It has no server endpoint: the form only collects the address and payment
 * choice, and the answers come back to the webhook as an `nfm_reply` message
 * (server/whatsapp/bot.ts places the order from them).
 *
 * Pure data on purpose: the upload script imports it outside Next.
 */

export const FLOW_NAME = "mudkraft_checkout";
export const FLOW_SCREEN = "DETAILS";

export const FLOW_JSON = {
  version: "6.0",
  screens: [
    {
      id: FLOW_SCREEN,
      title: "Delivery details",
      terminal: true,
      success: true,
      data: {
        name: { type: "string", __example__: "Asha Sharma" },
        summary: { type: "string", __example__: "1 × Clay Bhagona 4 L · Total ₹1,200" },
      },
      layout: {
        type: "SingleColumnLayout",
        children: [
          { type: "TextBody", text: "${data.summary}" },
          {
            type: "TextInput",
            name: "name",
            label: "Full name",
            "input-type": "text",
            required: true,
            "init-value": "${data.name}",
          },
          { type: "TextArea", name: "address", label: "House, street, area", required: true },
          { type: "TextInput", name: "city", label: "City", "input-type": "text", required: true },
          {
            type: "TextInput",
            name: "pincode",
            label: "Pincode",
            "input-type": "number",
            required: true,
            "helper-text": "6 digits",
          },
          {
            type: "TextInput",
            name: "email",
            label: "Email (for your invoice)",
            "input-type": "email",
            required: false,
          },
          {
            type: "RadioButtonsGroup",
            name: "payment",
            label: "How would you like to pay?",
            required: true,
            "data-source": [
              { id: "cod", title: "Cash on delivery" },
              { id: "online", title: "Pay online (UPI, card, net banking)" },
            ],
          },
          { type: "TextCaption", text: "Doorstep delivery. The charge for your PIN code is shown before you pay." },
          {
            type: "Footer",
            label: "Place order",
            "on-click-action": {
              name: "complete",
              payload: {
                name: "${form.name}",
                address: "${form.address}",
                city: "${form.city}",
                pincode: "${form.pincode}",
                email: "${form.email}",
                payment: "${form.payment}",
              },
            },
          },
        ],
      },
    },
  ],
};
