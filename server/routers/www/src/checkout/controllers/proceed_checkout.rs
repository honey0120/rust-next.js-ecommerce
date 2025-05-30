use actix_web::{ post, web::{ self }, HttpResponse };
use entity::{ order::OrderAddress, sea_orm_active_enums::OrderStatus };
use extractors::{ auth::Authenticated, validator::ValidatedJson };
use utils::{ db::create_primary_id, error::{ HttpError, ResponseWithMessage }, AppState };
use sea_orm::{ ActiveValue::NotSet, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set };
use crate::{ checkout::schema::ProceedCheckoutInput, messages::Messages };

/// Proceed checkout
#[utoipa::path(
    tag = "Checkout",
    context_path = "/checkouts",
    request_body(content = ProceedCheckoutInput),
    responses(
        (status = StatusCode::OK, body = ResponseWithMessage, description = "Response message"),
        (
            status = StatusCode::INTERNAL_SERVER_ERROR,
            body = ResponseWithMessage,
            description = "Internal Server Error",
        )
    )
)]
#[post("")]
pub async fn proceed_checkout(
    app_data: web::Data<AppState>,
    input: ValidatedJson<ProceedCheckoutInput>,
    user: Authenticated
) -> Result<HttpResponse, HttpError> {
    let input = input.into_inner();
    let db = &app_data.db;
    let user_id = user.id.to_owned();

    let ProceedCheckoutInput { payment_method, address_id } = input;

    // get user all checkout items
    let checkout_items = entity::checkout::Entity
        ::find()
        .filter(entity::checkout::Column::UserId.eq(&user_id))
        .order_by_desc(entity::checkout::Column::CreatedAt)
        .all(db).await?;

    // check if checkout items are empty
    if checkout_items.is_empty() {
        return Err(HttpError::bad_request(Messages::CheckoutEmpty));
    }

    // get user address
    let address = entity::address::Entity
        ::find_by_id(&address_id)
        .filter(entity::address::Column::UserId.eq(&user_id))
        .one(db).await?
        .ok_or_else(|| { HttpError::not_found(Messages::AddressNotFound(&address_id)) })?;

    let address = OrderAddress {
        city: address.city,
        first_name: address.first_name,
        full_address: address.full_address,
        last_name: address.last_name,
        phone_number: address.phone_number,
        state: address.state,
        landmark: address.landmark,
        postal_code: address.postal_code,
    };

    // convert checkout items to orders items
    let order_items = checkout_items
        .iter()
        .map(|item| {
            entity::order::ActiveModel {
                id: Set(create_primary_id()),
                product_id: Set(item.product_id.to_owned()),
                quantity: Set(item.quantity),
                created_at: NotSet,
                updated_at: NotSet,
                user_id: Set(user_id.to_owned()),
                payment_method: Set(payment_method.to_owned()),
                status: Set(OrderStatus::Success),
                address:Set(address.to_owned()),
            }
        })
        .collect::<Vec<entity::order::ActiveModel>>();

    // create orders
    entity::order::Entity::insert_many(order_items).exec(db).await?;

    // delete checkout items
    entity::checkout::Entity
        ::delete_many()
        .filter(entity::checkout::Column::UserId.eq(&user_id))
        .exec(db).await?;

    let response = ResponseWithMessage {
        message: Messages::CheckoutSuccessful.to_string(),
    };
    Ok(HttpResponse::Ok().json(response))
}
