import { getOrders, OrderStatus } from "@/client";
import { APP_ROUTES } from "@/config/routes";
import { authedClient } from "@/utils/authed-client";
import { Button, Divider, Typography } from "@jamsr-ui/react";
import { FetchError } from "@repo/components/fetch-error";
import { NextImage, NextLink } from "@repo/components/next";
import { cn } from "@repo/utils/class-name";
import { fDateTime } from "@repo/utils/time";
import React from "react";
import { OrdersEmpty } from "./orders-empty";
import { OrderPagination } from "./pagination";

type Props = {
  page: number;
};

export const OrdersList = async (props: Props) => {
  const { page } = props;
  const fetchClient = await authedClient();
  const { data, error } = await getOrders({
    client: fetchClient,
    query: {
      page,
    },
  });
  if (error) return <FetchError error={error} />;
  const { orders, totalRecords } = data;
  const totalPage = Math.ceil(totalRecords / 10);
  return (
    <div className="mt-8 flex flex-col gap-8">
      <div className="flex flex-col gap-8">
        {orders.length === 0 && <OrdersEmpty />}
        {orders.map((item, idx) => {
          const {
            product: { size, style, images, title, slug, id },
            order: { status, createdAt, id: orderId },
          } = item;
          const thumbnail = images[0]!;
          const productUrl = APP_ROUTES.products.view(id, slug);
          return (
            <React.Fragment key={idx}>
              <div className="flex gap-4">
                <NextLink
                  href={productUrl}
                  className="shrink-0"
                >
                  <div className="flex h-40 w-32 items-center justify-center">
                    <NextImage
                      image={thumbnail}
                      alt={title}
                      className="w-32 rounded-lg"
                    />
                  </div>
                </NextLink>
                <div className="flex grow flex-col gap-1 text-foreground-secondary">
                  <Typography
                    as="p"
                    className={cn("text-foreground-secondary", {
                      "text-success": status === OrderStatus.SUCCESS,
                      "text-danger": status === OrderStatus.PENDING,
                      "text-warning": status === OrderStatus.PENDING,
                    })}
                  >
                    {status}
                  </Typography>
                  <Typography
                    as={NextLink}
                    className="line-clamp-2 font-medium text-foreground"
                    href={productUrl}
                  >
                    {title}
                  </Typography>
                  <Typography as="p">{size}</Typography>
                  <Typography as="p">{style}</Typography>
                  <Typography
                    as="p"
                    variant="paragraph2"
                    className="text-foreground-tertiary"
                  >
                    Ordered On: {fDateTime(createdAt)}
                  </Typography>
                </div>
                <div className="flex flex-col gap-2 max-md:hidden">
                  <Button
                    isRounded
                    color="primary"
                  >
                    Track Package
                  </Button>
                  <Button
                    isRounded
                    variant="outlined"
                    color="primary"
                    href={APP_ROUTES.orders.view(orderId)}
                    as={NextLink}
                  >
                    View details
                  </Button>
                  <Button
                    isRounded
                    variant="light"
                    color="secondary"
                  >
                    Invoice
                  </Button>
                </div>
              </div>
              <Divider />
            </React.Fragment>
          );
        })}
      </div>
      <OrderPagination
        activePage={page}
        total={totalPage}
      />
    </div>
  );
};
